import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Card,
    CardContent,
    Button,
    Stack,
    Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DownloadIcon from '@mui/icons-material/Download';

const HelpSupport: React.FC = () => {
    const faqs = [
        {
            question: "How do I upload a new DPR for analysis?",
            answer: "Navigate to the 'Upload DPR' section from the sidebar. You can drag and drop your PDF/Word documents or click to select files. Once uploaded, the AI will automatically begin the scanning process."
        },
        {
            question: "What does the 'Feasibility Rating' mean?",
            answer: "The AI feasibility rating is a predictive score (0-100%) indicating the likelihood of project success based on technical parameters, compliance with guidelines, and historical data of similar projects."
        },
        {
            question: "How can I fix a 'Restricted Zone' conflict?",
            answer: "If the Geospatial Verification tool detects an overlap with a restricted zone (e.g., Forest), you must revise the site coordinates in your DPR or upload a clearance certificate from the Ministry of Environment, Forest and Climate Change."
        },
        {
            question: "Who can access the 'Settings' page?",
            answer: "The Settings page is restricted to Admin users. It allows configuration of notification preferences, password management, and viewing profile details."
        },
        {
            question: "What formats are supported for document upload?",
            answer: "Currently, the system supports PDF (.pdf) and Microsoft Word (.docx) files. Please ensure the file size does not exceed 25MB."
        }
    ];

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
                    Help & Support Center
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Find answers to common questions or get in touch with our support team.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Left Column: FAQs */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                            <MenuBookIcon color="primary" fontSize="large" />
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f2c59' }}>
                                Frequently Asked Questions
                            </Typography>
                        </Stack>

                        {faqs.map((faq, index) => (
                            <Accordion key={index} disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid #e0e0e0' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{faq.question}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        {faq.answer}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Paper>

                    {/* User Manual Section */}
                    <Box sx={{ mt: 3 }}>
                        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#e3f2fd', border: '1px solid #90caf9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1565c0' }}>User Manual v1.0</Typography>
                                <Typography variant="body2" color="text.secondary">Detailed guide on using the CPMS Portal.</Typography>
                            </Box>
                            <Button variant="contained" startIcon={<DownloadIcon />}>
                                Download PDF
                            </Button>
                        </Paper>
                    </Box>
                </Grid>

                {/* Right Column: Contact & Support */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: '#0f2c59', color: 'white', mb: 3 }}>
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <SupportAgentIcon sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                Need Assistance?
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>
                                Our technical support team is available Mon-Fri, 9:00 AM - 6:00 PM IST.
                            </Typography>

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                            <Stack spacing={2} alignItems="center">
                                <Button
                                    variant="outlined"
                                    startIcon={<PhoneIcon />}
                                    fullWidth
                                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}
                                >
                                    1800-111-555 (Toll Free)
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<EmailIcon />}
                                    fullWidth
                                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}
                                >
                                    support-cpms@nic.in
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Technical Partner
                        </Typography>
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/9/91/National_Informatics_Centre_%28NIC%29_logo.png"
                            alt="NIC Logo"
                            style={{ height: 50, marginBottom: 10 }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                            National Informatics Centre<br />
                            Ministry of Electronics & IT
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default HelpSupport;
