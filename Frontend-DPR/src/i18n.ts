import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translations
const resources = {
    en: {
        translation: {
            "app_title": "DPR Analysis System",
            "welcome": "Welcome to DPR Analysis",
            "upload_title": "Upload DPR Documents",
            "upload_desc": "Drag & drop PDF files here, or click to select files",
            "analysis_dashboard": "Analysis Dashboard",
            "reports": "Reports",
            "settings": "Settings",
            "logout": "Logout",
            "login": "Login",
            "chatbot_greeting": "Hi! I'm InfraMind AI, your DPR assistant. How can I help you today?",
            "ask_inframind": "Ask InfraMind...",
            "language": "Language"
        }
    },
    hi: {
        translation: {
            "app_title": "डीपीआर विश्लेषण प्रणाली",
            "welcome": "डीपीआर विश्लेषण में आपका स्वागत है",
            "upload_title": "डीपीआर दस्तावेज़ अपलोड करें",
            "upload_desc": "पीडीएफ फाइलें यहाँ खींचें और छोड़ें, या फ़ाइलें चुनने के लिए क्लिक करें",
            "analysis_dashboard": "विश्लेषण डैशबोर्ड",
            "reports": "रिपोर्ट",
            "settings": "सेटिंग्स",
            "logout": "लॉग आउट",
            "login": "लॉग इन",
            "chatbot_greeting": "नमस्ते! मैं इंफ्रामाइंड एआई हूँ, आपका डीपीआर सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?",
            "ask_inframind": "इंफ्रामाइंड से पूछें...",
            "language": "भाषा"
        }
    },
    mr: {
        translation: {
            "app_title": "डीपीआर विश्लेषण प्रणाली",
            "welcome": "डीपीआर विश्लेषण मध्ये आपले स्वागत आहे",
            "upload_title": "डीपीआर दस्तऐवज अपलोड करा",
            "upload_desc": "येथे पीडीएफ फाइल्स ड्रॅग आणि ड्रॉप करा, किंवा फाइल्स निवडण्यासाठी क्लिक करा",
            "analysis_dashboard": "विश्लेषण डॅशबोर्ड",
            "reports": "अहवाल",
            "settings": "सेटिंग्ज",
            "logout": "लॉग आउट",
            "login": "लॉग इन",
            "chatbot_greeting": "नमस्कार! मी इन्फ्रामाइंड एआय आहे, तुमचा डीपीआर सहाय्यक. आज मी तुम्हाला कशी मदत करू शकतो?",
            "ask_inframind": "इन्फ्रामाइंडला विचारा...",
            "language": "भाषा"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
