import fs from 'fs';

const surgicalExtract = () => {
    const filePath = 'src/pages/StoreCheckoutPixSuccess.tsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    // We want the block that starts around the search results we saw earlier
    // Specifically the one containing a.nav-skip-to-main-content
    // We'll search for that landmark and find the start {` and end `}
    const landmark = 'a.nav-skip-to-main-content, a.nav-a11y-feedback-link';
    const landmarkIndex = content.indexOf(landmark);
    
    if (landmarkIndex === -1) {
        console.error('Landmark not found');
        return;
    }

    // Find the opening {` before the landmark
    const openingIndex = content.lastIndexOf('{`', landmarkIndex);
    // Find the closing `} after the landmark
    const closingIndex = content.indexOf('`}', landmarkIndex);

    if (openingIndex !== -1 && closingIndex !== -1) {
        const css = content.substring(openingIndex + 2, closingIndex);
        console.log(`Extracted clean CSS. Length: ${css.length}`);

        const mobileFix = '\n\n/* Mobile width adjustments */\n@media screen and (max-width: 767px) {\n  main#root-app, .grid-view__container, .andes-card, .grid-view__main {\n    width: 100% !important;\n    max-width: 100% !important;\n    padding: 0 10px !important;\n    margin: 0 auto !important;\n  }\n}\n';

        fs.writeFileSync('src/pages/StoreLogin.css', css + mobileFix, 'utf8');
        console.log('Successfully wrote surgical StoreLogin.css');
    } else {
        console.error('Failed to find exact extraction points');
    }
};

surgicalExtract();
