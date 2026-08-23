from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_dpr(filename="real_DPR.pdf"):
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    Story = []

    # Title
    title_style = styles['Heading1']
    title_style.alignment = 1
    Story.append(Paragraph("Detailed Project Report (DPR)", title_style))
    Story.append(Paragraph("Construction of 4-Lane Bridge Over River Yamuna", styles['Heading2']))
    Story.append(Spacer(1, 12))

    # Executive Summary
    Story.append(Paragraph("1. Executive Summary", styles['Heading2']))
    Story.append(Paragraph(
        "This Detailed Project Report (DPR) outlines the technical, financial, and environmental feasibility of constructing a 4-lane high-level bridge over the River Yamuna. The project aims to reduce traffic congestion and improve connectivity between major economic hubs. The total estimated cost of the project is Rs. 450 Crores, with a proposed completion timeline of 36 months.",
        styles['Normal']
    ))
    Story.append(Spacer(1, 12))

    # Technical Specifications
    Story.append(Paragraph("2. Technical Specifications & Engineering Design", styles['Heading2']))
    Story.append(Paragraph(
        "The proposed bridge is an extradosed cable-stayed structure with a total length of 1.2 kilometers. The foundation involves deep pile foundations suitable for the alluvial soil deposits in the riverbed. Pavement design for the approach roads follows IRC:37 guidelines for flexible pavements designed for 150 MSA traffic.",
        styles['Normal']
    ))
    Story.append(Spacer(1, 12))

    # BoQ and Cost Breakdown
    Story.append(Paragraph("3. Bill of Quantities (BoQ) & Cost Estimates", styles['Heading2']))
    data = [
        ['Component', 'Description', 'Cost (Rs. Crores)'],
        ['Substructure', 'Piling, Pier Caps, Abutments', '120.50'],
        ['Superstructure', 'Girders, Deck Slab, Cables', '180.00'],
        ['Approach Roads', 'Earthwork, Pavement, Drainage', '85.50'],
        ['Miscellaneous', 'Lighting, Signage, Toll Plaza', '24.00'],
        ['Contingency', 'Physical and Price Contingencies', '40.00'],
        ['Total', '', '450.00']
    ]
    t = Table(data, colWidths=[120, 200, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    Story.append(t)
    Story.append(Spacer(1, 12))

    # Environmental Impact
    Story.append(Paragraph("4. Environmental and Social Impact Assessment (ESIA)", styles['Heading2']))
    Story.append(Paragraph(
        "An extensive Environmental Impact Assessment (EIA) was conducted. The project requires the diversion of 2.5 hectares of forest land. Mitigation measures include compensatory afforestation at a 1:10 ratio and the installation of noise barriers near sensitive receptors like schools. The cost includes Rs. 15 Crores allocated strictly for the Environmental Management Plan (EMP). No major displacement of local settlements is expected, minimizing social rehabilitation requirements.",
        styles['Normal']
    ))
    Story.append(Spacer(1, 12))

    # Risk Assessment
    Story.append(Paragraph("5. Risk Assessment & Mitigation", styles['Heading2']))
    Story.append(Paragraph(
        "Key risks include potential flooding during the monsoon season and delays in statutory clearances (forest and wildlife). Mitigation strategies involve scheduling sub-structure works purely during the dry season and initiating parallel clearance processes prior to financial closure. Financial risks are mitigated through a fixed-price EPC contract model.",
        styles['Normal']
    ))

    doc.build(Story)

if __name__ == '__main__':
    create_dpr()
