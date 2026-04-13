// Rich Snippets Enhancement for Maximum CTR
// This script adds advanced structured data for better search appearance

document.addEventListener('DOMContentLoaded', function() {
    // Add How-To Schema for action-oriented articles
    function addHowToSchema() {
        const howToArticles = {
            'transportation-climate-guide': {
                name: "How to Reduce Your Transportation Carbon Footprint",
                description: "Step-by-step guide to cutting transportation emissions by 73%",
                steps: [
                    "Switch to electric vehicle (73% emission reduction)",
                    "Use public transit (saves 4.8 tons CO2/year)", 
                    "Bike for short trips (zero emissions)",
                    "Combine trips to reduce mileage"
                ]
            },
            'food-climate-solutions': {
                name: "How to Transform Your Kitchen for Climate Impact",
                description: "Complete guide to kitchen climate solutions",
                steps: [
                    "Adopt plant-based meals (73% emission reduction)",
                    "Reduce food waste (saves 8% global emissions)",
                    "Buy local and seasonal produce",
                    "Compost kitchen scraps"
                ]
            }
        };

        const currentArticle = window.location.pathname.split('/').pop().replace('.html', '');
        const howToData = howToArticles[currentArticle];
        
        if (howToData) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "HowTo",
                "name": howToData.name,
                "description": howToData.description,
                "step": howToData.steps.map((step, index) => ({
                    "@type": "HowToStep",
                    "position": index + 1,
                    "name": step,
                    "text": step
                }))
            };
            
            addStructuredData(schema);
        }
    }

    // Add FAQ Schema with high-CTR questions
    function addFAQSchema() {
        const faqData = {
            'critical-climate-year-2025': [
                {
                    question: "Why is 2025 the critical climate year?",
                    answer: "2025 is critical because the carbon budget for 1.5°C will be exhausted at 170 billion tons remaining, making climate action urgent."
                },
                {
                    question: "What happens when the 1.5°C target is lost?",
                    answer: "When 1.5°C is lost, we face increased extreme weather, sea level rise, and climate adaptation becomes essential."
                }
            ],
            'transportation-climate-guide': [
                {
                    question: "How much can electric vehicles reduce emissions?",
                    answer: "Electric vehicles can reduce emissions by 73% compared to gas cars, saving approximately 4.8 tons of CO2 annually."
                },
                {
                    question: "What is the fastest way to reduce transportation emissions?",
                    answer: "Switching to electric vehicles provides the fastest and largest emissions reduction at 73%, followed by public transit use."
                }
            ]
        };

        const currentArticle = window.location.pathname.split('/').pop().replace('.html', '');
        const articleFAQs = faqData[currentArticle];
        
        if (articleFAQs) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": articleFAQs.map(faq => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.answer
                    }
                }))
            };
            
            addStructuredData(schema);
        }
    }

    // Add Event Schema for time-sensitive content
    function addEventSchema() {
        const eventArticles = {
            'critical-climate-year-2025': {
                name: "Climate Action Deadline 2025",
                description: "Critical year when 1.5°C carbon budget will be exhausted",
                startDate: "2025-01-01",
                endDate: "2025-12-31"
            }
        };

        const currentArticle = window.location.pathname.split('/').pop().replace('.html', '');
        const eventData = eventArticles[currentArticle];
        
        if (eventData) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "Event",
                "name": eventData.name,
                "description": eventData.description,
                "startDate": eventData.startDate,
                "endDate": eventData.endDate,
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode"
            };
            
            addStructuredData(schema);
        }
    }

    // Helper function to add structured data
    function addStructuredData(schema) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }

    // Initialize all enhancements
    addHowToSchema();
    addFAQSchema();
    addEventSchema();
});
