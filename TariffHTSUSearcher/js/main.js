// --- GLOBAL ELEMENTS & STATE ---
const tabs = document.querySelectorAll('.tab-btn');
const contents = { 
    queryContent: document.getElementById('queryContent'), 
    htsContent: document.getElementById('htsContent'), 
    sourcesContent: document.getElementById('sourcesContent') 
};
// This is no longer needed for App 2 but might be used by App 1's hts-code-link logic
let htsAllData = []; 

// --- MAIN APP INITIALIZATION ---
function initializeApp() {
    tabs.forEach(tab => tab.addEventListener('click', (e) => {
        tabs.forEach(t => {
            t.classList.remove('active');
            t.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        });
        const activeTab = e.currentTarget;
        activeTab.classList.add('active');
        activeTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        
        Object.values(contents).forEach(content => content.style.display = 'none');
        const contentId = activeTab.id.replace('tab', '').toLowerCase() + 'Content';
        contents[contentId].style.display = 'block';
    }));
    
    initializeApp1();
    initializeHtsApiApp(); // Changed from initializeHtsAppV2
}

document.addEventListener('DOMContentLoaded', initializeApp);
