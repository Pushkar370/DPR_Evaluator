import json
import logging
from typing import List, Dict, Any

from backend.config import settings
from backend.schemas import AnalysisReport, DynamicInsight
from backend.rag_service import document_rag

from groq import Groq

logger = logging.getLogger(__name__)

def generate_dynamic_overview(job_id: str, extracted_text: str, images: List[Dict[str, Any]] = []) -> AnalysisReport:
    """
    Generates a flexible, comprehensive overview of the DPR using RAG logic.
    Replaces the rigid 'run_rag_analysis_cloud'.
    """
    report = AnalysisReport(job_id=job_id, status="PROCESSING")
    
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY missing. Returning mock AnalysisReport.")
        report.executive_summary = "Mock executive summary. Please provide GROQ_API_KEY for real analysis."
        report.insights = [
            DynamicInsight(topic="Mock Topic", details="This is a mock insight.", risks=["Mock risk"])
        ]
        from backend.schemas import EvaluationSummary
        report.evaluation_summary = EvaluationSummary(
            project_name="Mock Infrastructure Development Project",
            approval_status="Approve",
            slec_recommendation="Based on comprehensive evaluation, SLEC approves the project subject to compliance with environmental corrective actions.",
            key_project_metrics=[
                {"label": "Total Project Cost", "main_value": "₹25,00,00,000.00", "sub_details": ["MDoNER Share: ₹22,50,00,000", "State Share: ₹2,50,00,000"]},
                {"label": "Implementing Agency", "main_value": "State Health Department", "sub_details": []},
                {"label": "Location", "main_value": "Manipur, Imphal East", "sub_details": []},
                {"label": "Evaluation Scores", "main_value": "82.8/100", "sub_details": ["Technical: 82/100", "Financial: 84/100"]}
            ],
            flagged_risks=["API Error: Using Mock Data"],
            missing_sections=[],
            recommendations=["Re-run with valid GROQ_API_KEY", "Check environmental compliance"]
        )
        report.status = "COMPLETED"
        return report

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        model_name = settings.GROQ_MODEL_NAME
        
        # Step 1: Initial Skeleton / Executive Summary / Dynamic Topics
        # We pass the first 15000 chars roughly to get the lay of the land
        initial_context = extracted_text[:15000]
        prompt_1 = (
            "You are the Coordinator of a Ministry Review Board. We are assessing a Detailed Project Report (DPR).\n"
            f"Based on the following extracted text, provide a JSON object containing two fields:\n"
            '1. "executive_summary": A high-level executive summary of what this project is about, its scale, and its primary objectives (under 3 paragraphs).\n'
            '2. "dynamic_topics": A list of 3 to 4 specialized AI Agent Personas needed to review this document (e.g., "The Financial Auditor Agent", "The Legal Compliance Agent", "The Structural Engineer Agent"). Do NOT just list topics, list the agent titles.\n\n'
            "Respond ONLY with a valid JSON object containing those two fields.\n\n"
            f"Extracted Text:\n{initial_context}"
        )
        
        res1 = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt_1}],
            model=model_name,
            response_format={"type": "json_object"}
        )
        try:
            res1_json = json.loads(res1.choices[0].message.content.strip())
            exec_summary = res1_json.get("executive_summary", "Summary unavailable.")
            topics_to_explore = res1_json.get("dynamic_topics", [
                "The Financial Auditor Agent",
                "The Technical Engineer Agent",
                "The Environmental Compliance Agent",
                "The Risk Assessment Agent"
            ])
        except Exception as e:
            logger.error(f"Failed to parse initial dynamic topics JSON: {e}")
            exec_summary = "Could not generate executive summary."
            topics_to_explore = ["The General Assessment Agent"]
             
        report.executive_summary = exec_summary
        
        # Step 2: Dynamic Insights via RAG
        insights = []
        for topic in topics_to_explore:
            # Query the personalized document RAG
            rag_chunks = document_rag.query_document(job_id, query=topic, limit=3)
            context_text = "\n\n".join([chunk.get("text", "") for chunk in rag_chunks]) if rag_chunks else "No specific sections found."
            
            prompt_2 = (
                f"You are '{topic}' of the Ministry Review Board. The user wants your specialized assessment.\n"
                f"Here are the most relevant excerpts retrieved from the document for you:\n{context_text}\n\n"
                "Respond ONLY with a valid JSON object containing:\n"
                '{"details": "Your agent narrative (2-3 sentences) evaluating this topic based ONLY on the excerpts.", '
                '"risks": ["risk 1", "risk 2"], '
                '"extracted_values": {"Metric Name": "Value"} }\n'
                "For 'extracted_values', intelligently identify only the most critical quantifiable metrics relevant to your specific persona from the context."
            )
            
            res2 = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt_2}],
                model=model_name,
                response_format={"type": "json_object"}
            )
            raw_json = res2.choices[0].message.content.strip()
                
            if raw_json.startswith("```json"):
                raw_json = raw_json[7:-3].strip()
            if raw_json.startswith("```"):
                raw_json = raw_json[3:-3].strip()
            
            try:
                parsed = json.loads(raw_json)
                insights.append(DynamicInsight(
                    topic=topic,
                    details=parsed.get("details", "Unable to extract details."),
                    risks=parsed.get("risks", []),
                    extracted_values=parsed.get("extracted_values", {})
                ))
            except Exception as e:
                logger.error(f"Failed to parse JSON for topic {topic}: {e} from {raw_json}")
                
        report.insights = insights
        
        # Step 3: Final Synthesis (AI Assessment Report Card)
        from backend.schemas import EvaluationSummary
        
        synthesis_context = f"Executive Summary:\n{report.executive_summary}\n\nAgent Reports:\n"
        for ins in insights:
            synthesis_context += f"Agent Persona: {ins.topic}\nAgent Analysis: {ins.details}\nExtracted Metrics: {json.dumps(ins.extracted_values)}\nIdentified Risks: {json.dumps(ins.risks)}\n\n"
            
        prompt_3 = (
            "You are the 'Chief Assessor' of the Ministry Review Board. Based ONLY on the following Executive Summary and the specialized Agent Reports, "
            "generate a final, structured Evaluation Report Card for this Detailed Project Report (DPR). "
            "Identify the explicit or inferred project name, determine an overall approval status ('Approve', 'Reject', or 'Revise'), and a formal narrative recommendation paragraph. "
            "Determine the 4-5 most critically important project metrics (e.g., Total Project Cost, Implementing Agency, Location, Evaluation Scores) to display in a UI dashboard, "
            "formatting currencies neatly (e.g., ₹25,00,00,000.00). Also identify the most critical gaps, flag the highest severity risks, and provide actionable recommendations.\n\n"
            "Respond ONLY with a valid JSON object matching this exact structure:\n"
            '{\n'
            '  "project_name": "Name of the Project",\n'
            '  "approval_status": "Approve",\n'
            '  "slec_recommendation": "Narrative paragraph detailing the recommendation...",\n'
            '  "key_project_metrics": [\n'
            '    {"label": "Total Project Cost", "main_value": "₹25,00,00,000.00", "sub_details": ["MDoNER Share: ₹22,50,00,000", "State Share: ₹2,50,00,000"]},\n'
            '    {"label": "Implementing Agency", "main_value": "Agency Name", "sub_details": []}\n'
            '  ],\n'
            '  "flagged_risks": ["Risk 1", "Risk 2"],\n'
            '  "missing_sections": ["Missing data 1"],\n'
            '  "recommendations": ["Recommendation 1"]\n'
            '}\n\n'
            f"Data to evaluate:\n{synthesis_context}"
        )
        
        try:
            res3 = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt_3}],
                model=model_name,
                response_format={"type": "json_object"}
            )
            raw_eval_json = res3.choices[0].message.content.strip()
            
            if raw_eval_json.startswith("```json"):
                raw_eval_json = raw_eval_json[7:-3].strip()
            if raw_eval_json.startswith("```"):
                raw_eval_json = raw_eval_json[3:-3].strip()
                
            parsed_eval = json.loads(raw_eval_json)
            
            raw_metrics = parsed_eval.get("key_project_metrics", [])
            key_metrics = []
            if isinstance(raw_metrics, list):
                for rm in raw_metrics:
                    if isinstance(rm, dict):
                        key_metrics.append({
                            "label": rm.get("label", "Unknown Metric"),
                            "main_value": rm.get("main_value", "Unknown Value"),
                            "sub_details": rm.get("sub_details", [])
                        })

            report.evaluation_summary = EvaluationSummary(
                project_name=parsed_eval.get("project_name", "Unknown Project"),
                approval_status=parsed_eval.get("approval_status", "Pending Review"),
                slec_recommendation=parsed_eval.get("slec_recommendation", "No specific recommendation provided."),
                key_project_metrics=key_metrics,
                flagged_risks=parsed_eval.get("flagged_risks", []),
                missing_sections=parsed_eval.get("missing_sections", []),
                recommendations=parsed_eval.get("recommendations", [])
            )
        except Exception as e:
            logger.error(f"Failed to generate evaluation summary: {e}")
            report.evaluation_summary = EvaluationSummary(
                project_name="Could not parse",
                approval_status="Error",
                key_project_metrics=[],
                flagged_risks=["Could not generate"], 
                missing_sections=["Could not generate"], 
                recommendations=["Could not generate"]
            )

        # Step 4: Attach Images
        image_list = []
        for img in images:
            image_list.append({"path": img["path"], "caption": img.get("ref", "Extracted Chart/Image")})
        report.extracted_images = image_list
        
        report.status = "COMPLETED"
        return report

    except Exception as e:
        logger.error(f"Error generating dynamic overview: {str(e)}")
        if "quota" in str(e).lower() or "401" in str(e) or "403" in str(e):
            logger.warning("Groq API Error. Returning mock report for testing.")
            report.executive_summary = (
                "**Mock Executive Summary**\n\n"
                "The system successfully executed the PyMuPDF extraction, successfully indexed the chunks into Qdrant using embeddings, "
                "and triggered the Groq analysis endpoint. However, there was an API error.\n\n"
            )
            report.insights = [
                DynamicInsight(topic="The Financial Auditor Agent", details="The extraction and RAG pipeline queried for financial data successfully. (Mocked response due to API quota)", risks=["API Error"]),
                DynamicInsight(topic="The Technical Engineer Agent", details="The extraction isolated technical metrics. (Mocked response due to API quota)", risks=["API Error"])
            ]
            from backend.schemas import EvaluationSummary
            report.evaluation_summary = EvaluationSummary(
                project_name="Mock Infrastructure Development Project",
                approval_status="Approve",
                slec_recommendation="Based on comprehensive evaluation, SLEC approves the project subject to compliance with environmental corrective actions.",
                key_project_metrics=[
                    {"label": "Total Project Cost", "main_value": "₹25,00,00,000.00", "sub_details": ["MDoNER Share: ₹22,50,00,000", "State Share: ₹2,50,00,000"]},
                    {"label": "Implementing Agency", "main_value": "State Health Department", "sub_details": []},
                    {"label": "Location", "main_value": "Manipur, Imphal East", "sub_details": []},
                    {"label": "Evaluation Scores", "main_value": "82.8/100", "sub_details": ["Technical: 82/100", "Financial: 84/100"]}
                ],
                flagged_risks=["API Error: Using Mock Data"],
                missing_sections=[],
                recommendations=["Re-run with valid GROQ_API_KEY", "Check environmental compliance"]
            )
            report.status = "COMPLETED"
            return report
            
        report.status = "FAILED"
        report.error_message = str(e)
        return report
