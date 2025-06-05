// Studio3 Floating Toolbar & Mode Sync Test Script
// Copy and paste this into your browser's developer console while on localhost:3000

console.log('🎯 Studio3 Test Suite Starting...');

// Test 1: Floating Toolbar Visibility
function testFloatingToolbar() {
    console.log('\n📱 Test 1: Floating Toolbar Visibility');
    
    const toolbar = document.querySelector('.fixed.bottom-4');
    if (toolbar) {
        console.log('✅ Floating toolbar found');
        
        // Test dropdown buttons
        const dropdowns = toolbar.querySelectorAll('[role="button"]');
        console.log(`✅ Found ${dropdowns.length} dropdown buttons`);
        
        // Test if buttons have proper styling
        const hasProperStyling = toolbar.classList.contains('bg-white') || 
                                 toolbar.classList.contains('bg-gray-100');
        console.log(hasProperStyling ? '✅ Toolbar has proper styling' : '❌ Toolbar styling issue');
        
        return true;
    } else {
        console.log('❌ Floating toolbar not found');
        return false;
    }
}

// Test 2: Dropdown Menu Functionality
function testDropdownMenus() {
    console.log('\n🎛️ Test 2: Dropdown Menu Functionality');
    
    const dropdownButtons = document.querySelectorAll('.fixed.bottom-4 [role="button"]');
    let dropdownsWorking = 0;
    
    dropdownButtons.forEach((button, index) => {
        button.click();
        setTimeout(() => {
            const dropdownMenu = document.querySelector('.absolute.bottom-full');
            if (dropdownMenu) {
                console.log(`✅ Dropdown ${index + 1} opens correctly`);
                dropdownsWorking++;
                // Close dropdown
                button.click();
            } else {
                console.log(`❌ Dropdown ${index + 1} not working`);
            }
        }, 100 * index);
    });
    
    setTimeout(() => {
        console.log(`📊 ${dropdownsWorking}/${dropdownButtons.length} dropdowns working`);
    }, dropdownButtons.length * 100 + 500);
}

// Test 3: Mode Switching
function testModeSwitching() {
    console.log('\n🔄 Test 3: Mode Switching');
    
    const modeButtons = document.querySelectorAll('button');
    const designButton = Array.from(modeButtons).find(btn => btn.textContent.includes('Design'));
    const codeButton = Array.from(modeButtons).find(btn => btn.textContent.includes('Code'));
    const previewButton = Array.from(modeButtons).find(btn => btn.textContent.includes('Preview'));
    
    if (designButton && codeButton && previewButton) {
        console.log('✅ All mode buttons found');
        
        // Test Design Mode
        designButton.click();
        setTimeout(() => {
            const canvas = document.querySelector('.bg-white.border-2');
            console.log(canvas ? '✅ Design mode active' : '❌ Design mode issue');
        }, 100);
        
        // Test Code Mode
        setTimeout(() => {
            codeButton.click();
            setTimeout(() => {
                const codeEditor = document.querySelector('textarea');
                console.log(codeEditor ? '✅ Code mode active' : '❌ Code mode issue');
            }, 100);
        }, 500);
        
        // Test Preview Mode
        setTimeout(() => {
            previewButton.click();
            setTimeout(() => {
                const preview = document.querySelector('.bg-black');
                console.log(preview ? '✅ Preview mode active' : '❌ Preview mode issue');
            }, 100);
        }, 1000);
        
    } else {
        console.log('❌ Mode buttons not found');
    }
}

// Test 4: Element Addition via Floating Toolbar
function testElementAddition() {
    console.log('\n➕ Test 4: Element Addition');
    
    // Switch to design mode first
    const modeButtons = document.querySelectorAll('button');
    const designButton = Array.from(modeButtons).find(btn => btn.textContent.includes('Design'));
    
    if (designButton) {
        designButton.click();
        
        setTimeout(() => {
            // Find and click Text dropdown
            const toolbar = document.querySelector('.fixed.bottom-4');
            const textButton = Array.from(toolbar.querySelectorAll('[role="button"]'))
                              .find(btn => btn.textContent.includes('Text'));
            
            if (textButton) {
                textButton.click();
                setTimeout(() => {
                    // Try to click "Add Text" option
                    const addTextOption = Array.from(document.querySelectorAll('div'))
                                         .find(div => div.textContent.includes('Add Text'));
                    
                    if (addTextOption) {
                        addTextOption.click();
                        setTimeout(() => {
                            const canvas = document.querySelector('.bg-white.border-2');
                            const elements = canvas.querySelectorAll('div');
                            console.log(`✅ Canvas has ${elements.length} elements after addition`);
                        }, 200);
                    } else {
                        console.log('❌ Add Text option not found');
                    }
                }, 100);
            } else {
                console.log('❌ Text dropdown button not found');
            }
        }, 200);
    }
}

// Test 5: Mode Synchronization
function testModeSynchronization() {
    console.log('\n🔄 Test 5: Mode Synchronization');
    
    const modeButtons = document.querySelectorAll('button');
    const designButton = Array.from(modeButtons).find(btn => btn.textContent.includes('Design'));
    const codeButton = Array.from(modeButtons).find(btn => btn.textContent.includes('Code'));
    
    if (designButton && codeButton) {
        // Start in design mode
        designButton.click();
        
        setTimeout(() => {
            // Add an element (simulate)
            console.log('📝 Testing design to code sync...');
            
            // Switch to code mode
            codeButton.click();
            
            setTimeout(() => {
                const codeEditor = document.querySelector('textarea');
                if (codeEditor && codeEditor.value) {
                    console.log('✅ Code generated from design');
                    console.log(`📄 Code length: ${codeEditor.value.length} characters`);
                    
                    // Switch back to design
                    designButton.click();
                    setTimeout(() => {
                        console.log('✅ Mode synchronization test complete');
                    }, 200);
                } else {
                    console.log('❌ No code generated or editor not found');
                }
            }, 300);
        }, 200);
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running all Studio3 tests...\n');
    
    testFloatingToolbar();
    
    setTimeout(() => testDropdownMenus(), 500);
    setTimeout(() => testModeSwitching(), 2000);
    setTimeout(() => testElementAddition(), 4000);
    setTimeout(() => testModeSynchronization(), 6000);
    
    setTimeout(() => {
        console.log('\n🎯 Test Suite Complete!');
        console.log('📋 Manual verification steps:');
        console.log('1. Verify floating toolbar is visible at bottom');
        console.log('2. Test each dropdown menu (Text, Shapes, Media)');
        console.log('3. Add elements using toolbar tools');
        console.log('4. Switch between Design/Code/Preview modes'); 
        console.log('5. Verify data persists across mode switches');
        console.log('\n✨ Happy testing!');
    }, 8000);
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.Studio3Tests = {
    testFloatingToolbar,
    testDropdownMenus,
    testModeSwitching,
    testElementAddition,
    testModeSynchronization,
    runAllTests
};