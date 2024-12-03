// Tour steps configuration
const tourSteps = [
    {
        target: '.library-selector',
        content:
            'Start by choosing your icon library. Choose between Material Symbols or Font Awesome.',
        position: 'bottom'
    },
    {
        target: '.style-selector',
        content:
            'Select the style variant for your chosen library (Outlined, Rounded, etc.).',
        position: 'bottom'
    },
    {
        target: '.search-bar',
        content: 'Search for icons by name to find exactly what you need.',
        position: 'right'
    },
    {
        target: '.sidebar-content',
        content: 'Browse and click on any icon to select it for customization.',
        position: 'right'
    },
    {
        target: '.color-pickers-row',
        content: 'Choose primary and secondary colors for your icon.',
        position: 'left'
    },
    {
        target: '.effect-options',
        content:
            'Apply effects like shadows, glows, or gradients to enhance your icon.',
        position: 'left'
    },
    {
        target: '.workspace-content',
        content:
            'Preview your icon here. Use Ctrl + Mouse Wheel to zoom in/out.',
        position: 'middle'
    },
    {
        target: '.export-options',
        content:
            'Export your customized icon as CSS, or save your configuration for later.',
        position: 'left'
    }
]

class Tour {
    constructor(steps) {
        this.steps = steps
        this.currentStep = 0
        this.overlay = null
        this.tooltip = null
    }

    start() {
        this.createOverlay()
        this.showStep(0)
    }

    createOverlay() {
        this.overlay = document.createElement('div')
        this.overlay.className = 'tour-overlay'
        document.body.appendChild(this.overlay)
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.end()
            return
        }

        const step = this.steps[index]
        const target = document.querySelector(step.target)

        if (!target) {
            console.error(`Target not found: ${step.target}`)
            return
        }

        // Create highlight
        const highlight = document.createElement('div')
        highlight.className = 'tour-highlight'
        const rect = target.getBoundingClientRect()
        Object.assign(highlight.style, {
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
        })
        document.body.appendChild(highlight)

        // Create tooltip
        if (this.tooltip) {
            this.tooltip.remove()
        }

        this.tooltip = document.createElement('div')
        this.tooltip.className = 'tour-tooltip'
        this.tooltip.innerHTML = `
        <div>${step.content}</div>
        <div class="tour-tooltip-buttons">
            ${index > 0
                ? '<button class="button" id="prevStep">Previous</button>'
                : ''
            }
            <button class="button" id="nextStep">
                ${index === this.steps.length - 1 ? 'Finish' : 'Next'}
            </button>
        </div>
    `

        // Position tooltip
        const tooltipRect = {
            top: rect.top,
            left: rect.left,
            width: 300, // max-width from CSS
            height: 100 // approximate
        }

        switch (step.position) {
            case 'bottom':
                tooltipRect.top = rect.bottom + 10
                tooltipRect.left = rect.left + (rect.width - tooltipRect.width) / 2
                break
            case 'top':
                tooltipRect.top = rect.top - tooltipRect.height - 10
                tooltipRect.left = rect.left + (rect.width - tooltipRect.width) / 2
                break
            case 'left':
                tooltipRect.top = rect.top + (rect.height - tooltipRect.height) / 2
                tooltipRect.left = rect.left - tooltipRect.width - 10
                break
            case 'right':
                tooltipRect.top = rect.top + (rect.height - tooltipRect.height) / 2
                tooltipRect.left = rect.right + 10
                break
        }

        Object.assign(this.tooltip.style, {
            top: `${tooltipRect.top}px`,
            left: `${tooltipRect.left}px`
        })

        document.body.appendChild(this.tooltip)

        // Add event listeners
        const nextBtn = this.tooltip.querySelector('#nextStep')
        const prevBtn = this.tooltip.querySelector('#prevStep')

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next())
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prev())
        }
    }

    next() {
        this.currentStep++
        this.showStep(this.currentStep)
    }

    prev() {
        this.currentStep--
        this.showStep(this.currentStep)
    }

    end() {
        if (this.overlay) {
            this.overlay.remove()
        }
        if (this.tooltip) {
            this.tooltip.remove()
        }
        document.querySelectorAll('.tour-highlight').forEach(el => el.remove())
    }
}

// Add to your initialization code
// document.getElementById('startTour').addEventListener('click', () => {
//     const tour = new Tour(tourSteps)
//     tour.start()
// })

// Global state
let selectedIcon = null
let currentLibrary = 'material'
let currentFamily = 'outlined'
let zoomLevel = 100
let primaryPickr, secondaryPickr;
let currentBlendMode = 'normal';

const GRADIENT_DIRECTIONS = {
    'top-right': { angle: 225, coords: { start: [1, 0], end: [0, 1] } },    // Primary color starts at top-right
    'top-left': { angle: 135, coords: { start: [0, 0], end: [1, 1] } },     // Primary color starts at top-left
    'bottom-right': { angle: 315, coords: { start: [1, 1], end: [0, 0] } }, // Primary color starts at bottom-right
    'bottom-left': { angle: 45, coords: { start: [0, 1], end: [1, 0] } }    // Primary color starts at bottom-left
};

let currentGradientAngle = 'top-right'; // Default

class WorkingIconsManager {
    constructor() {
        this.icons = new Map();
        this.autoUpdate = false;
    }

    generateIdentifier(config) {
        return `${config.library}-${config.family}-${config.icon}-${new Date().toISOString().split('T')[0]}`;
    }

    validateConfig(config) {
        if (!config) return false;

        const requiredFields = [
            'library',
            'family',
            'icon',
            'primaryColor',
            'secondaryColor',
            'weight',
            'fill',
            'grade',
            'size',
            'offset',
            'opacity'
        ];

        return requiredFields.every(field => {
            const hasField = config.hasOwnProperty(field);
            if (!hasField) {
                console.warn(`Missing required field: ${field}`);
            }
            return hasField;
        });
    }

    addOrUpdateIcon(config) {
        if (!this.validateConfig(config)) {
            console.error('Invalid configuration provided');
            return false;
        }

        const identifier = this.generateIdentifier(config);

        if (this.icons.has(identifier) && !this.autoUpdate) {
            if (!confirm('Update existing icon configuration?')) {
                return false;
            }
        }

        this.icons.set(identifier, {
            ...config,
            gradientAngle: currentGradientAngle,
            animation: document.getElementById('currentAnimation')?.textContent?.toLowerCase() || 'none',
            timestamp: Date.now()
        });

        this.updateDisplay();
        return true;
    }

    updateWithoutConfirm(config) {
        if (!this.validateConfig(config)) {
            console.error('Invalid configuration provided');
            return false;
        }

        const identifier = this.generateIdentifier(config);
        this.icons.set(identifier, {
            ...config,
            gradientAngle: currentGradientAngle,
            animation: document.getElementById('currentAnimation')?.textContent?.toLowerCase() || 'none',
            timestamp: Date.now()
        });
        this.updateDisplay();
        return true;
    }

    loadIcon(identifier) {
        const config = this.icons.get(identifier);
        if (!config) {
            console.error('Configuration not found for identifier:', identifier);
            return;
        }

        if (!this.validateConfig(config)) {
            console.error('Invalid stored configuration');
            return;
        }

        try {
            // Store current icon before loading new one
            if (selectedIcon) {
                const currentConfig = getCurrentConfiguration();
                if (this.validateConfig(currentConfig)) {
                    const currentIdentifier = this.generateIdentifier(currentConfig);
                    if (currentIdentifier !== identifier) {
                        this.addOrUpdateIcon(currentConfig);
                    }
                }
            }

            // Load the selected configuration
            applyConfiguration(config);
            selectedIcon = config.icon;
            updatePreview();
        } catch (error) {
            console.error('Error loading icon configuration:', error);
        }
    }

    removeIcon(identifier) {
        this.icons.delete(identifier);
        this.updateDisplay();
    }


    exportAllIcons() {
        let css = `/* Icon Studio Theme */
/* Generated: ${new Date().toLocaleString()} */\n
/* Theme Base Styles */
.icon-theme-base {
--icon-primary: ${document.getElementById('primaryColor').value};
--icon-secondary: ${document.getElementById('secondaryColor').value};
}

/* Material Symbols Base Config */
.material-symbols-base {
font-variation-settings: 
    'FILL' ${document.getElementById('fillSlider').value},
    'wght' ${document.getElementById('weightSlider').value},
    'GRAD' ${document.getElementById('gradeSlider').value},
    'opsz' ${document.getElementById('sizeSlider').value};
}\n`;

        // Get current animation
        const currentAnimation = document.getElementById('currentAnimation').textContent.toLowerCase();
        if (currentAnimation && currentAnimation !== 'none') {
            css += `\n/* Animation */\n`;
            if (currentLibrary === 'material') {
                css += `.material-symbols-${currentFamily} {\n`;
            } else {
                css += `.fa-${currentFamily} {\n`;
            }
            css += `    animation: ${currentAnimation} 1s infinite;\n`;
            css += `}\n`;
            css += getAnimationKeyframes(currentAnimation) + '\n';
        }

        // Individual icon styles
        this.icons.forEach((config, identifier) => {
            css += `\n/* ${config.icon} */\n`;
            if (config.library === 'material') {
                css += `.icon-${config.icon.toLowerCase()} {\n`;
                css += `    font-family: "Material Symbols ${config.family}";\n`;
                css += `    content: "${config.icon}";\n`;
                css += `    color: ${config.primaryColor};\n`;
                if (config.animation && config.animation !== 'none') {
                    css += `    animation: ${config.animation} 1s infinite;\n`;
                }
                css += `}\n`;
            } else {
                css += `.icon-${config.icon.toLowerCase()} {\n`;
                css += `    font-family: "Font Awesome 6 ${config.family}";\n`;
                css += `    content: "${config.icon}";\n`;
                css += `    color: ${config.primaryColor};\n`;
                if (config.animation && config.animation !== 'none') {
                    css += `    animation: ${config.animation} 1s infinite;\n`;
                }
                css += `}\n`;
            }
        });

        // Add usage guide
        css += `\n/* Theme Usage Guide */
/*
Usage Examples:

1. Basic icon usage:
.icon {
font-family: inherit;
color: var(--icon-primary);
}

2. File browser usage:
.file-browser-icon {
font-size: 24px;
color: var(--icon-primary);
}

3. Theme customization:
.custom-theme {
--icon-primary: #FF0000;
--icon-secondary: #00FF00;
}

4. File type specific icons:
.file-pdf { @extend .file-type-pdf; }
.file-image { @extend .file-type-image; }
.folder { @extend .file-type-folder; }

5. Animation usage:
.animated-icon { animation: [animation-name] 1s infinite; }
*/`;

        return css;
    }

    generateIconCSS(config) {
        let css = '';
        const iconName = config.icon.toLowerCase().replace(/_/g, '-');

        if (config.library === 'material') {
            css += `.icon-${iconName} {\n`;
            css += `    font-family: "Material Symbols ${config.family}";\n`;
            css += `    content: "${config.icon}";\n`;
        } else {
            css += `.icon-${iconName} {\n`;
            css += `    font-family: "Font Awesome 6 ${config.family}";\n`;
            css += `    content: "\\f${config.icon}";\n`;
        }

        css += `    color: ${config.primaryColor};\n`;

        if (config.animation && config.animation !== 'none') {
            css += `    animation: ${config.animation} 1s infinite;\n`;
        }

        css += `}\n`;
        return css;
    }

    generateFileTypeCSS(config) {
        // Map common icons to file types
        const fileTypeMap = {
            // Material Icons mappings
            folder: ['folder', 'directory'],
            description: ['file', 'document'],
            picture_as_pdf: ['pdf'],
            image: ['image', 'img', 'picture', 'photo'],
            videocam: ['video', 'movie'],
            audiotrack: ['audio', 'music', 'sound'],
            code: ['code', 'programming'],
            archive: ['zip', 'archive', 'compressed'],

            // Font Awesome mappings
            'folder': ['folder', 'directory'],
            'file': ['file', 'document'],
            'file-pdf': ['pdf'],
            'file-image': ['image', 'img', 'picture', 'photo'],
            'file-video': ['video', 'movie'],
            'file-audio': ['audio', 'music', 'sound'],
            'file-code': ['code', 'programming'],
            'file-archive': ['zip', 'archive', 'compressed']
        };

        let css = '';
        const iconName = config.icon.toLowerCase();

        if (fileTypeMap[iconName]) {
            fileTypeMap[iconName].forEach(type => {
                css += `\n/* ${type} file type */\n`;
                css += `.file-type-${type} {\n`;
                css += `    @extend .icon-${iconName};\n`;
                css += `}\n`;
            });
        }

        return css;
    }

    updateDisplay() {
        const grid = document.getElementById('workingIconsGrid');
        if (!grid) {
            console.error('Working icons grid not found');
            return;
        }

        grid.innerHTML = '';

        this.icons.forEach((config, identifier) => {
            if (this.validateConfig(config)) {
                const iconElement = this.createIconElement(config, identifier);
                grid.appendChild(iconElement);
            }
        });
    }

    createIconElement(config, identifier) {
        const div = document.createElement('div');
        div.className = 'working-icon';

        try {
            div.innerHTML = `
            <div class="icon-preview">
                ${config.library === 'material'
                    ? `<span class="material-symbols-${config.family}" 
                       style="color: ${config.primaryColor}">${config.icon}</span>`
                    : `<i class="fa-${config.family} fa-${config.icon}" 
                       style="color: ${config.primaryColor}"></i>`
                }
            </div>
            <span class="icon-name" data-name="${config.icon}">${config.icon}</span>
            <button class="remove-icon" title="Remove">×</button>
        `;

            // Add tooltip to show configuration details
            div.title = `${config.icon}
Primary: ${config.primaryColor}
Secondary: ${config.secondaryColor}
Animation: ${config.animation || 'none'}`;

            div.querySelector('.remove-icon').onclick = e => {
                e.stopPropagation();
                if (confirm('Remove this icon?')) {
                    this.removeIcon(identifier);
                }
            };

            div.onclick = () => this.loadIcon(identifier);

            // Apply animation if it exists
            if (config.animation && config.animation !== 'none') {
                const iconElement = div.querySelector('.material-symbols-outlined, .fa');
                if (iconElement) {
                    iconElement.classList.add(config.animation);
                }
            }

        } catch (error) {
            console.error('Error creating icon element:', error);
            return document.createElement('div'); // Return empty div on error
        }

        return div;
    }
}

// Helper function to apply configuration
function applyConfiguration(config) {
    try {
        // Set library and family
        if (currentLibrary !== config.library) {
            switchLibrary(config.library);
        }
        if (currentFamily !== config.family) {
            currentFamily = config.family;
            updateFamilyButtons();
        }

        // Set colors
        document.getElementById('primaryColor').value = config.primaryColor;
        document.getElementById('secondaryColor').value = config.secondaryColor;
        if (primaryPickr) primaryPickr.setColor(config.primaryColor);
        if (secondaryPickr) secondaryPickr.setColor(config.secondaryColor);

        // Set sliders
        setSliderValue('weightSlider', config.weight);
        setSliderValue('fillSlider', config.fill);
        setSliderValue('gradeSlider', config.grade);
        setSliderValue('sizeSlider', config.size);
        setSliderValue('offsetSlider', config.offset);
        setSliderValue('opacitySlider', config.opacity);

        // Set animation
        if (config.animation) {
            document.getElementById('currentAnimation').textContent =
                config.animation === 'none' ? 'None' :
                    config.animation.charAt(0).toUpperCase() + config.animation.slice(1);
        }

        // Update effects
        document.querySelectorAll('.effect-option').forEach(option => {
            if (config.effects) {
                option.classList.toggle('active', config.effects.includes(option.dataset.effect));
            }
        });

    } catch (error) {
        console.error('Error applying configuration:', error);
    }
}

// Initialize working icons manager
const workingIconsManager = new WorkingIconsManager()

// Icon libraries

let iconLibraries = {
    material: [], // We can start with empty arrays
    fa: {}
}

// initialization code
document.addEventListener('DOMContentLoaded', async function () {
    try {
        const iconsLoaded = await loadIcons()
        if (iconsLoaded) {
            initializeColorPickers();
            initializeSavedConfigs();
            initializeModals();
            initializeLibrarySelectors();
            initializeIconGrid();
            initializeEventListeners();
            initializeQuickFeatures();
            initializeGradientControls();
            initializeAnimations();

        }
    } catch (error) {
        console.error('Initialization error:', error)
    }
})

async function loadFontAwesomeIcons() {
    try {
        const response = await fetch('icons/fa_free_icons.json')
        const faIcons = await response.json()
        iconLibraries.fa = faIcons
        console.log('Font Awesome icons loaded successfully')
    } catch (error) {
        console.error('Error loading Font Awesome icons:', error)
    }
}

async function loadIcons() {
    const loadingOverlay = document.getElementById('loadingOverlay')
    const loadingText = loadingOverlay.querySelector('.loading-text')

    try {
        console.log("loading material icons")
        loadingText.textContent = 'Loading Material Icons...'
        const materialResponse = await fetch('icons/material_icons.json')
        const materialData = await materialResponse.json()

        console.log("loading fa icons")
        loadingText.textContent = 'Loading Font Awesome Icons...'
        const faResponse = await fetch('icons/fa_free_icons.json')
        const faData = await faResponse.json()

        // Update iconLibraries object
        iconLibraries = {
            material: materialData.material,
            fa: faData
        }

        loadingText.textContent = 'Initializing...'

        // Verify data integrity
        if (!iconLibraries.material || !iconLibraries.fa) {
            throw new Error('Icon data is incomplete')
        }

        console.log('Icons loaded successfully:', {
            material: iconLibraries.material.length,
            fa: {
                solid: iconLibraries.fa.solid.length,
                regular: iconLibraries.fa.regular.length,
                brands: iconLibraries.fa.brands.length
            }
        })

        // Hide loading overlay with fade effect
        loadingOverlay.style.opacity = '0'
        setTimeout(() => {
            loadingOverlay.style.display = 'none'
        }, 500)

        return true
    } catch (error) {
        console.error('Error loading icons:', error)
        loadingText.textContent =
            'Error loading icons. Please refresh the page.'
        loadingOverlay.classList.add('error')
        return false
    }
}

function updateIconCount() {
    const dropdown = document.getElementById('librarySelect');
    const countDisplay = document.getElementById('iconCount');
    const selected = dropdown.value;
    const [library, family] = selected.split('-');

    let count;
    if (library === 'material') {
        count = `${iconLibraries.material.length} Material icons`;
    } else {
        count = `${iconLibraries.fa[family].length} Font Awesome ${family} icons`;
    }

    // For the badge version
    if (countDisplay) {
        countDisplay.textContent = count;
    }
}

function initializeLibrarySelectors() {
    // Populate style selector based on current library
    const styleSelector = document.querySelector('.style-selector')

    const materialStyles = [
        { family: 'outlined', label: 'Outlined' },
        { family: 'rounded', label: 'Rounded' },
        { family: 'sharp', label: 'Sharp' }
    ]

    const faStyles = [
        { family: 'solid', label: 'Solid' },
        { family: 'regular', label: 'Regular' },
        { family: 'light', label: 'Light' },
        { family: 'duotone', label: 'Duotone' }
    ]

    function updateStyleButtons(library) {
        const styles = library === 'material' ? materialStyles : faStyles
        styleSelector.innerHTML = styles
            .map(
                style => `
        <button class="button${currentFamily === style.family ? ' active' : ''
                    }" 
                data-family="${style.family}">
            ${style.label}
        </button>
    `
            )
            .join('')

        // Add click handlers
        styleSelector.querySelectorAll('.button').forEach(button => {
            button.addEventListener('click', () => {
                currentFamily = button.dataset.family
                styleSelector
                    .querySelectorAll('.button')
                    .forEach(btn => btn.classList.toggle('active', btn === button))
                initializeIconGrid()
                if (selectedIcon) updatePreview()
            })
        })
    }

    // Initial setup
    updateStyleButtons(currentLibrary)
}

function initializeGradientControls() {
    const dropdownTrigger = document.querySelector('.split-button .dropdown-trigger');
    const gradientAngles = document.querySelector('.gradient-angles');

    // Toggle dropdown
    dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        gradientAngles.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        gradientAngles.classList.remove('active');
    });

    // Handle angle selection
    gradientAngles.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            currentGradientAngle = button.dataset.angle;

            // Update the direction indicator
            const directionIcon = document.getElementById('currentGradientDirection');
            // Map direction to icon name
            const iconMap = {
                'top-right': 'north_east',
                'top-left': 'north_west',
                'bottom-right': 'south_east',
                'bottom-left': 'south_west'
            };
            directionIcon.textContent = iconMap[currentGradientAngle];

            if (selectedIcon) {
                // Just update preview - it handles everything now
                updatePreview();

                // Silently update working icons without confirmation
                const config = getCurrentConfiguration();
                config.gradientAngle = currentGradientAngle;
                workingIconsManager.updateWithoutConfirm(config);
            }

            gradientAngles.classList.remove('active');
        }
    });
}


function initializeQuickFeatures() {
    document.getElementById('swapColorsBtn').addEventListener('click', () => {
        const primaryColor = document.getElementById('primaryColor').value;
        const secondaryColor = document.getElementById('secondaryColor').value;

        // Swap colors using our stored Pickr instances
        primaryPickr.setColor(secondaryColor);
        secondaryPickr.setColor(primaryColor);

        // Update hidden inputs
        document.getElementById('primaryColor').value = secondaryColor;
        document.getElementById('secondaryColor').value = primaryColor;

        // Update preview
        updatePreview();
    });

    // Auto-save toggle
    const autoSaveCheckbox = document.getElementById('autoSaveIcons');
    autoSaveCheckbox.checked = localStorage.getItem('autoSaveIcons') === 'true';

    autoSaveCheckbox.addEventListener('change', (e) => {
        localStorage.setItem('autoSaveIcons', e.target.checked);
    });
}

// Color picker initialization
function initializeColorPickers() {
    try {
        // Primary color picker
        primaryPickr = Pickr.create({
            el: '#primaryColorPicker',
            theme: 'nano',
            default: '#000000',
            swatches: [
                '#000000',
                '#FFFFFF',
                '#2196F3',
                '#E91E63',
                '#4CAF50',
                '#FFC107',
                '#9C27B0',
                '#795548',
                '#607D8B'
            ],
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    input: true,
                    save: true
                }
            }
        })

        // Secondary color picker
        secondaryPickr = Pickr.create({
            el: '#secondaryPicker',
            theme: 'nano',
            default: '#666666',
            swatches: [
                '#000000',
                '#FFFFFF',
                '#2196F3',
                '#E91E63',
                '#4CAF50',
                '#FFC107',
                '#9C27B0',
                '#795548',
                '#607D8B'
            ],
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    input: true,
                    save: true
                }
            }
        })

        // Handle color changes
        if (primaryPickr) {
            primaryPickr.on('change', color => {
                document.getElementById('primaryColor').value = color
                    .toHEXA()
                    .toString()
                updatePreview()
            })
        }

        if (secondaryPickr) {
            secondaryPickr.on('change', color => {
                document.getElementById('secondaryColor').value = color
                    .toHEXA()
                    .toString()
                updatePreview()
            })
        }
    } catch (error) {
        console.error('Color picker initialization failed:', error)
    }
}


function initializeIconGrid() {
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = ''; // Clear existing icons

    if (currentLibrary === 'material') {
        iconLibraries.material.forEach(icon => {
            createIconElement(icon, 'material', grid);  // Pass grid as parameter
        });
    } else {
        // Get the correct FA icon list based on family
        const icons = iconLibraries.fa[currentFamily] || [];
        icons.forEach(icon => {
            createIconElement(icon, 'fa', grid);  // Pass grid as parameter
        });
    }
}

function createIconElement(icon, library, grid) {  // Add grid parameter
    const div = document.createElement('div');
    div.className = 'icon-item';

    if (library === 'material') {
        div.innerHTML = `
        <span class="material-symbols-${currentFamily}">${icon}</span>
        <span class="icon-name">${icon}</span>
    `;
    } else {
        const prefix = getFAPrefix(currentFamily);
        div.innerHTML = `
        <i class="${prefix} fa-${icon}"></i>
        <span class="icon-name">${icon}</span>
    `;
    }

    div.addEventListener('click', () => selectIcon(icon, div));
    grid.appendChild(div);
}

function getFAPrefix(family) {
    switch (family) {
        case 'solid':
            return 'fas'
        case 'regular':
            return 'far'
        case 'brands':
            return 'fab'
        default:
            return 'fas'
    }
}

function initializeEventListeners() {
    // Library and style selectors
    document.querySelectorAll('.library-selector .button').forEach(button => {
        button.addEventListener('click', () => {
            const library = button.dataset.library
            switchLibrary(library)
        })
    })

    // Sliders
    document.getElementById('weightSlider').addEventListener('input', e => {
        document.getElementById('weightValue').textContent = e.target.value
        updatePreview()
    })

    document.getElementById('fillSlider').addEventListener('input', e => {
        document.getElementById('fillValue').textContent = e.target.value
        updatePreview()
    })

    document.getElementById('gradeSlider').addEventListener('input', e => {
        document.getElementById('gradeValue').textContent = e.target.value
        updatePreview()
    })

    document.getElementById('sizeSlider').addEventListener('input', e => {
        document.getElementById('sizeValue').textContent = e.target.value
        updatePreview()
    })

    document.getElementById('offsetSlider').addEventListener('input', e => {
        document.getElementById('offsetValue').textContent = e.target.value
        updatePreview()
    })

    document.getElementById('opacitySlider').addEventListener('input', e => {
        document.getElementById('opacityValue').textContent = e.target.value
        updatePreview()
    })

    // Effect buttons
    document.querySelectorAll('.effect-option').forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active')
            updatePreview()
        })
    })

    document.getElementById('rotateSlider').addEventListener('input', (e) => {
        document.getElementById('rotateValue').textContent = e.target.value;
        updatePreview();
    });

    // blend mode
    const blendButton = document.querySelector('.split-button[data-effect="blend"]');
    const modesList = blendButton.querySelector('.blend-modes');

    // Toggle dropdown
    blendButton.querySelector('.dropdown-trigger').addEventListener('click', (e) => {
        e.stopPropagation();
        modesList.classList.toggle('active');
    });

    // Handle mode selection
    modesList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            currentBlendMode = button.dataset.mode;
            document.getElementById('currentBlendMode').textContent =
                currentBlendMode.charAt(0).toUpperCase() + currentBlendMode.slice(1);
            updatePreview();
            modesList.classList.remove('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        modesList.classList.remove('active');
    });



    // Search functionality
    document.getElementById('searchInput').addEventListener('input', e => {
        const searchTerm = e.target.value.toLowerCase()
        document.querySelectorAll('.icon-item').forEach(item => {
            const iconName = item.querySelector('.icon-name').textContent
            item.style.display = iconName.includes(searchTerm) ? 'flex' : 'none'
        })
    })

    // Workspace controls
    document
        .getElementById('toggleBackground')
        .addEventListener('click', () => {
            const preview = document.getElementById('iconPreview')
            preview.classList.toggle('dark-bg')
        })

    document.getElementById('zoomIn').addEventListener('click', () => {
        zoomLevel = Math.min(zoomLevel + 25, 200)
        updateZoom()
    })

    document.getElementById('zoomOut').addEventListener('click', () => {
        zoomLevel = Math.max(zoomLevel - 25, 50)
        updateZoom()
    })

    document.getElementById('exportPNGBtn').addEventListener('click', () => {
        // Get current size setting or use default
        const size = parseInt(document.getElementById('sizeSlider').value) * 2
        exportAsPNG(size)
    })

    // Working icons controls
    const autoUpdateToggle = document.getElementById('autoUpdateIcons')
    if (autoUpdateToggle) {
        autoUpdateToggle.addEventListener('change', e => {
            workingIconsManager.autoUpdate = e.checked
        })
    }

    // const exportAllBtn = document.getElementById('exportAllIcons')
    // if (exportAllBtn) {
    //     exportAllBtn.addEventListener('click', () => {
    //         const css = workingIconsManager.exportAllIcons()
    //         const filename = `icon-studio-theme-all-${new Date().toISOString().split('T')[0]
    //             }.css`
    //         downloadFile(css, filename, 'text/css')
    //     })
    // }

    document.getElementById('exportAllIcons').addEventListener('click', () => {
        const css = workingIconsManager.exportAllIcons();
        const filename = `icon-studio-theme-${new Date().toISOString().split('T')[0]}.css`;
        downloadFile(css, filename, 'text/css');
    });

    document
        .getElementById('librarySelect')
        .addEventListener('change', function (e) {
            const [library, family] = e.target.value.split('-')
            currentLibrary = library
            currentFamily = family

            // Update icon grid
            initializeIconGrid();
            updateIconCount();

            // Clear current selection
            selectedIcon = null
            const previewSection = document.getElementById('previewSection')
            if (previewSection) {
                previewSection.style.display = 'none'
            }
        })

    // Export buttons
    document.getElementById('copyCSSBtn').addEventListener('click', copyCSS)
    document
        .getElementById('exportThemeBtn')
        .addEventListener('click', showExportModal)
    document
        .getElementById('saveConfigBtn')
        .addEventListener('click', saveConfiguration)

    document.querySelector('.workspace-content').addEventListener(
        'wheel',
        e => {
            // Prevent default scroll
            e.preventDefault()

            // Only zoom if Ctrl key is pressed
            if (e.ctrlKey || e.metaKey) {
                // Zoom out
                if (e.deltaY > 0) {
                    zoomLevel = Math.max(zoomLevel - 10, 50)
                }
                // Zoom in
                else {
                    zoomLevel = Math.min(zoomLevel + 10, 200)
                }

                updateZoom()
            }
        },
        { passive: false }
    )
}

function switchLibrary(library) {
    currentLibrary = library

    // Update library buttons
    document.querySelectorAll('.library-selector .button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.library === library)
    })

    // Show/hide library specific controls
    const materialControls = document.querySelector('.material-controls')
    const faControls = document.querySelector('.fa-controls')

    if (materialControls) {
        materialControls.style.display =
            library === 'material' ? 'block' : 'none'
    }
    if (faControls) {
        faControls.style.display = library === 'fa' ? 'block' : 'none'
    }

    // Update style selector
    initializeLibrarySelectors()

    // Reset family to default for new library
    currentFamily = library === 'material' ? 'outlined' : 'solid'

    // Update icon grid
    initializeIconGrid()

    // Clear selection
    selectedIcon = null

    const previewSection = document.getElementById('previewSection')
    if (previewSection) {
        previewSection.style.display = 'none'
    }
}

// Select an icon
function selectIcon(icon, element) {
    try {
        // Store current icon if one exists
        if (selectedIcon) {
            const currentConfig = getCurrentConfiguration()
            workingIconsManager.addOrUpdateIcon(currentConfig)
        }



        // Store current icon if auto-save is enabled
        if (selectedIcon && document.getElementById('autoSaveIcons').checked) {
            const currentConfig = getCurrentConfiguration();
            workingIconsManager.addOrUpdateIcon(currentConfig);
        }

        // Remove previous selection
        document
            .querySelectorAll('.icon-item.selected')
            .forEach(item => item.classList.remove('selected'))

        // Add selection to clicked icon
        // element.classList.add('selected')
        // selectedIcon = icon

        selectedIcon = icon;
        element.classList.add('selected');

        const newConfig = getCurrentConfiguration();
        workingIconsManager.addOrUpdateIcon(newConfig);

        // Update preview and info
        updatePreview()
        const iconNameElement = document.getElementById('iconName')
        if (iconNameElement) {
            iconNameElement.textContent = icon
        }

        const previewSection = document.getElementById('previewSection')
        if (previewSection) {
            previewSection.style.display = 'block'
        }
    } catch (error) {
        console.error('Error in selectIcon:', error)
    }
}

function updatePreview() {
    if (!selectedIcon) return;

    const previewSection = document.getElementById('previewSection');
    if (!previewSection) return;

    // Get active effects
    const effects = Array.from(document.querySelectorAll('.effect-option.active'))
        .map(opt => opt.dataset.effect);

    const primaryIcon = document.querySelector('.preview-icon.primary');
    const secondaryIcon = document.querySelector('.preview-icon.secondary');
    if (!primaryIcon || !secondaryIcon) return;

    const weight = document.getElementById('weightSlider').value;
    const fill = document.getElementById('fillSlider').value;
    const grade = document.getElementById('gradeSlider').value;
    const size = document.getElementById('sizeSlider').value;
    const offset = document.getElementById('offsetSlider').value;
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const opacity = document.getElementById('opacitySlider').value;
    const rotation = document.getElementById('rotateSlider').value;

    // Clear previous icons and styles
    primaryIcon.className = 'preview-icon primary';
    secondaryIcon.className = 'preview-icon secondary';
    primaryIcon.style = '';
    secondaryIcon.style = '';

    if (currentLibrary === 'material') {
        const baseClass = `material-symbols-${currentFamily}`;
        primaryIcon.className = `${baseClass} preview-icon primary`;
        secondaryIcon.className = `${baseClass} preview-icon secondary`;

        primaryIcon.textContent = selectedIcon;
        secondaryIcon.textContent = selectedIcon;

        const variationSettings = `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size}`;
        primaryIcon.style.fontVariationSettings = variationSettings;
        secondaryIcon.style.fontVariationSettings = variationSettings;
    } else {
        const baseClass = `fa-${currentFamily} fa-${selectedIcon}`;
        primaryIcon.innerHTML = `<i class="${baseClass}"></i>`;
        secondaryIcon.innerHTML = `<i class="${baseClass}"></i>`;
    }

    // Handle gradient effect first
    if (effects.includes('gradient')) {
        const direction = GRADIENT_DIRECTIONS[currentGradientAngle];
        if (direction) {
            primaryIcon.style.background = `linear-gradient(${direction.angle}deg, ${primaryColor}, ${secondaryColor})`;
            primaryIcon.style.webkitBackgroundClip = 'text';
            primaryIcon.style.webkitTextFillColor = 'transparent';
            secondaryIcon.style.opacity = '0';
        }
    } else {
        // Regular two-tone effect
        primaryIcon.style.color = primaryColor;
        secondaryIcon.style.color = secondaryColor;
        secondaryIcon.style.transform = `translate(${offset}px, ${offset}px)`;
        secondaryIcon.style.opacity = opacity;
    }

    // Apply other effects last
    if (!effects.includes('gradient')) {
        applyEffects(primaryIcon, secondaryIcon, effects);
    }

    // Apply rotation along with other transforms
    if (rotation !== "0") {
        primaryIcon.style.transform = `rotate(${rotation}deg)`;
        // If there's an offset, combine transforms
        if (effects.includes('gradient')) {
            secondaryIcon.style.opacity = '0';
        } else {
            secondaryIcon.style.transform = `translate(${offset}px, ${offset}px) rotate(${rotation}deg)`;
        }
    }

    // Apply blend mode if active
    if (effects.includes('blend') && currentBlendMode !== 'normal') {
        primaryIcon.style.mixBlendMode = currentBlendMode;
        if (!effects.includes('gradient')) {
            secondaryIcon.style.mixBlendMode = currentBlendMode;
        }
    }

    // Apply animation class if selected
    const animation = document.getElementById('currentAnimation').textContent.toLowerCase();
    if (animation !== 'none') {
        primaryIcon.classList.add(animation);
        secondaryIcon.classList.add(animation);
    } else {
        // Remove all animation classes
        const animations = ['bounce', 'pulse', 'shake', 'spin', 'flip', 'swing',
            'float', 'tada', 'wobble', 'jello', 'heartbeat',
            'rubberband', 'rollin', 'zoompulse', 'spiral'];
        animations.forEach(anim => {
            primaryIcon.classList.remove(anim);
            secondaryIcon.classList.remove(anim);
        });
    }


    updateCSS();
}

// Helper function to calculate CSS angle
function calculateCSSAngle(start, end) {
    // Map gradient coordinates to CSS angles

    const angleMap = {
        'bottom-left': 45,  // [0,0] to [1,1]
        'top-left': 135,  // [1,0] to [0,1]
        'bottom-right': 315,    // [0,1] to [1,0]
        'top-right': 225      // [1,1] to [0,0]
    };

    // Find the matching angle
    for (const [direction, coords] of Object.entries(GRADIENT_ANGLES)) {
        if (coords.start[0] === start[0] &&
            coords.start[1] === start[1] &&
            coords.end[0] === end[0] &&
            coords.end[1] === end[1]) {
            return angleMap[direction];
        }
    }
    return 45; // Default angle
}

// Effect application functions
function applyEffects(primaryIcon, secondaryIcon, activeEffects) {
    // Get colors at the start
    const primaryColorEl = document.getElementById('primaryColor')
    const secondaryColorEl = document.getElementById('secondaryColor')

    const primaryColor = primaryColorEl ? primaryColorEl.value : '#000000'
    const secondaryColor = secondaryColorEl
        ? secondaryColorEl.value
        : '#666666'

        // Reset existing effects
        ;[primaryIcon, secondaryIcon].forEach(icon => {
            if (!icon) return
            icon.style.filter = ''
            icon.style.background = ''
            icon.style.webkitBackgroundClip = ''
            icon.style.webkitTextFillColor = ''
        })

    // Apply each active effect
    activeEffects.forEach(effect => {
        if (!primaryIcon) return

        switch (effect) {
            case 'shadow':
                primaryIcon.style.filter =
                    'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))'
                break

            case 'glow':
                primaryIcon.style.filter = `drop-shadow(0 0 5px ${primaryColor})`
                break

            case 'gradient':
                primaryIcon.style.background = `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`
                primaryIcon.style.webkitBackgroundClip = 'text'
                primaryIcon.style.webkitTextFillColor = 'transparent'
                // Remove secondary icon when gradient is active
                if (secondaryIcon) {
                    secondaryIcon.style.opacity = '0'
                }
                break
        }
    })
}

function updateGradientAngle(angle) {
    currentGradientAngle = angle;
    updatePreview();
    // Update working icon if it matches current
    if (selectedIcon) {
        const config = getCurrentConfiguration();
        config.gradientAngle = angle;
        workingIconsManager.addOrUpdateIcon(config);
    }
}

// Zoom functionality
function updateZoom() {
    const preview = document.querySelector('.preview-layers')
    preview.style.transform = `scale(${zoomLevel / 100})`
    document.getElementById('zoomLevel').textContent = `${zoomLevel}%`
}

// Background toggle helper
function updateBackground(isDark) {
    const preview = document.getElementById('iconPreview')
    preview.style.background = isDark ? '#1a1a1a' : '#ffffff'
}

// Effect helper functions
function getEffectStyles(effects) {
    const styles = []
    const primaryColor = document.getElementById('primaryColor').value
    const secondaryColor = document.getElementById('secondaryColor').value

    effects.forEach(effect => {
        switch (effect) {
            case 'shadow':
                styles.push('filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));')
                break
            case 'glow':
                styles.push(`filter: drop-shadow(0 0 5px ${primaryColor});`)
                break
            case 'gradient':
                styles.push(`
                background: linear-gradient(45deg, ${primaryColor}, ${secondaryColor});
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            `)
                break
        }
    })

    return styles.join('\n    ')
}

// CSS Generation Functions

function updateCSS() {
    if (!selectedIcon) return;

    const weight = document.getElementById('weightSlider').value;
    const fill = document.getElementById('fillSlider').value;
    const grade = document.getElementById('gradeSlider').value;
    const size = document.getElementById('sizeSlider').value;
    const offset = document.getElementById('offsetSlider').value;
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;

    const activeEffects = Array.from(
        document.querySelectorAll('.effect-option.active')
    ).map(opt => opt.dataset.effect);

    let css = '';

    if (currentLibrary === 'material') {
        const className = `material-symbols-${currentFamily}`;
        const iconName = selectedIcon.replace(/_/g, '-');

        css = generateMaterialCSS(
            selectedIcon,
            { weight, fill, grade, size, offset, primaryColor, secondaryColor },
            activeEffects
        );
    } else {
        css = generateFontAwesomeCSS(
            selectedIcon,
            { primaryColor, secondaryColor, offset },
            activeEffects
        );
    }

    // Add animation CSS if selected
    const animation = document.getElementById('currentAnimation').textContent.toLowerCase();
    if (animation !== 'none') {
        css += `\n/* Animation */\n`;
        if (currentLibrary === 'material') {
            css += `.material-symbols-${currentFamily}.icon-${selectedIcon.replace(/_/g, '-')} {\n`;
        } else {
            css += `.fa-${currentFamily}.fa-${selectedIcon}-wrapper {\n`;
        }
        css += `    animation: ${animation} 1s infinite;\n}\n\n`;

        // Add keyframe definition
        css += getAnimationKeyframes(animation);
    }

    document.getElementById('cssCode').textContent = css;
}

// Add this new helper function to get animation keyframes
function getAnimationKeyframes(animation) {
    const keyframes = {
        bounce: `@keyframes bounce {
0%, 100% { transform: translateY(0); }
50% { transform: translateY(-20px); }
}`,
        pulse: `@keyframes pulse {
0% { transform: scale(1); }
50% { transform: scale(1.2); }
100% { transform: scale(1); }
}`,
        shake: `@keyframes shake {
0%, 100% { transform: translateX(0); }
25% { transform: translateX(-10px); }
75% { transform: translateX(10px); }
}`,
        spin: `@keyframes spin {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}`,
        flip: `@keyframes flip {
0% { transform: perspective(400px) rotateY(0); }
100% { transform: perspective(400px) rotateY(360deg); }
}`,
        swing: `@keyframes swing {
20% { transform: rotate(15deg); }
40% { transform: rotate(-10deg); }
60% { transform: rotate(5deg); }
80% { transform: rotate(-5deg); }
100% { transform: rotate(0deg); }
}`,
        float: `@keyframes float {
0% { transform: translateY(0); }
50% { transform: translateY(-10px) scale(1.05); }
100% { transform: translateY(0); }
}`,
        tada: `@keyframes tada {
0% { transform: scale(1); }
10%, 20% { transform: scale(0.9) rotate(-3deg); }
30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
100% { transform: scale(1) rotate(0); }
}`,
        wobble: `@keyframes wobble {
0% { transform: translateX(0%); }
15% { transform: translateX(-25%) rotate(-5deg); }
30% { transform: translateX(20%) rotate(3deg); }
45% { transform: translateX(-15%) rotate(-3deg); }
60% { transform: translateX(10%) rotate(2deg); }
75% { transform: translateX(-5%) rotate(-1deg); }
100% { transform: translateX(0%); }
}`,
        jello: `@keyframes jello {
0%, 100% { transform: scale3d(1, 1, 1); }
30% { transform: scale3d(1.25, 0.75, 1); }
40% { transform: scale3d(0.75, 1.25, 1); }
50% { transform: scale3d(1.15, 0.85, 1); }
65% { transform: scale3d(0.95, 1.05, 1); }
75% { transform: scale3d(1.05, 0.95, 1); }
}`,
        heartbeat: `@keyframes heartbeat {
0% { transform: scale(1); }
14% { transform: scale(1.3); }
28% { transform: scale(1); }
42% { transform: scale(1.3); }
70% { transform: scale(1); }
}`,
        rubberband: `@keyframes rubberband {
0% { transform: scale3d(1, 1, 1); }
30% { transform: scale3d(1.25, 0.75, 1); }
40% { transform: scale3d(0.75, 1.25, 1); }
50% { transform: scale3d(1.15, 0.85, 1); }
65% { transform: scale3d(.95, 1.05, 1); }
75% { transform: scale3d(1.05, .95, 1); }
100% { transform: scale3d(1, 1, 1); }
}`,
        rollin: `@keyframes rollin {
0% { transform: translateX(-100%) rotate(-120deg); }
100% { transform: translateX(0) rotate(0); }
}`,
        zoompulse: `@keyframes zoompulse {
0% { transform: scale(1); opacity: 1; }
50% { transform: scale(1.5); opacity: 0.7; }
100% { transform: scale(1); opacity: 1; }
}`,
        spiral: `@keyframes spiral {
0% { transform: rotate(0) scale(1); }
50% { transform: rotate(180deg) scale(0.5); }
100% { transform: rotate(360deg) scale(1); }
}`
    };

    return keyframes[animation] || '';
}

// Modify generateThemeCSS to include animations
function generateThemeCSS() {
    const config = getCurrentConfiguration();

    let css = `/* Icon Studio Theme Export */\n/* Generated: ${new Date().toLocaleString()} */\n\n`;

    if (currentLibrary === 'material') {
        css += generateMaterialThemeCSS(config);
    } else {
        css += generateFontAwesomeThemeCSS(config);
    }

    // Add animation if selected
    const animation = document.getElementById('currentAnimation').textContent.toLowerCase();
    if (animation !== 'none') {
        css += `\n/* Animation */\n`;
        css += `.${currentLibrary === 'material' ? 'material-symbols-' + currentFamily : 'fa-' + currentFamily} {\n`;
        css += `    animation: ${animation} 1s infinite;\n}\n\n`;
        css += getAnimationKeyframes(animation);
    }

    return css;
}


function generateMaterialCSS(icon, options, effects) {
    const className = `material-symbols-${currentFamily}`
    const iconName = icon.replace(/_/g, '-')

    let css = `/* Material Symbols Icon Styles */
.${className}.icon-${iconName} {
font-variation-settings: 
    'FILL' ${options.fill},
    'wght' ${options.weight},
    'GRAD' ${options.grade},
    'opsz' ${options.size};
color: ${options.primaryColor};
position: relative;
display: inline-block;
}

/* Two-tone effect */
.${className}.icon-${iconName}::after {
content: "${icon}";
position: absolute;
left: ${options.offset}px;
top: ${options.offset}px;
color: ${options.secondaryColor};
z-index: -1;
font-variation-settings: 
    'FILL' ${options.fill},
    'wght' ${options.weight},
    'GRAD' ${options.grade},
    'opsz' ${options.size};
}`

    // Add effects if any are active
    if (effects.length > 0) {
        css += '\n\n/* Applied effects */\n'
        css += `.${className}.icon-${iconName} {\n    ${getEffectStyles(
            effects
        )}\n}`
    }

    const rotation = document.getElementById('rotateSlider').value;
    if (rotation !== "0") {
        css += `\n/* Rotation */\n`;
        css += `.${className}.icon-${iconName} {\n    transform: rotate(${rotation}deg);\n}`;
    }

    return css
}

function generateFontAwesomeCSS(icon, options, effects) {
    const className = `fa-${currentFamily}`
    const iconName = icon.replace(/_/g, '-')

    let css = `/* Font Awesome Icon Styles */
.${className}.fa-${iconName}-wrapper {
position: relative;
display: inline-block;
}

.${className}.fa-${iconName} {
color: ${options.primaryColor};
}

/* Two-tone effect */
.${className}.fa-${iconName}-secondary {
position: absolute;
left: ${options.offset}px;
top: ${options.offset}px;
color: ${options.secondaryColor};
opacity: ${options.opacity};
z-index: -1;
}`

    // Add effects if any are active
    if (effects.length > 0) {
        css += '\n\n/* Applied effects */\n'
        css += `.${className}.fa-${iconName} {\n    ${getEffectStyles(
            effects
        )}\n}`
    }

    return css
}

// Helper Functions
function sanitizeIconName(name) {
    return name.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase()
}

function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

function hexToRgba(hex, opacity = 1) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function getIconDimensions(iconElement) {
    const rect = iconElement.getBoundingClientRect()
    return {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
    }
}

function formatCSSValue(value, unit = '') {
    return typeof value === 'number' ? `${value}${unit}` : value
}

function validateConfiguration(config) {
    const requiredFields = [
        'library',
        'family',
        'icon',
        'primaryColor',
        'secondaryColor'
    ]
    return requiredFields.every(field => config.hasOwnProperty(field))
}

function getCurrentConfiguration() {
    return {
        library: currentLibrary,
        family: currentFamily,
        icon: selectedIcon,
        primaryColor: document.getElementById('primaryColor').value,
        secondaryColor: document.getElementById('secondaryColor').value,
        weight: parseInt(document.getElementById('weightSlider').value),
        fill: parseInt(document.getElementById('fillSlider').value),
        grade: parseInt(document.getElementById('gradeSlider').value),
        size: parseInt(document.getElementById('sizeSlider').value),
        offset: parseFloat(document.getElementById('offsetSlider').value),
        opacity: parseFloat(document.getElementById('opacitySlider').value),
        effects: Array.from(
            document.querySelectorAll('.effect-option.active')
        ).map(opt => opt.dataset.effect),
        animation: document.getElementById('currentAnimation').textContent.toLowerCase()

    }
}

function setSliderValue(sliderId, value, updateUI = true) {
    const slider = document.getElementById(sliderId)
    slider.value = value
    if (updateUI) {
        const valueDisplay = document.getElementById(
            `${sliderId.replace('Slider', '')}Value`
        )
        if (valueDisplay) {
            valueDisplay.textContent = value
        }
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
        notification.classList.add('show')
        setTimeout(() => {
            notification.classList.remove('show')
            setTimeout(() => notification.remove(), 300)
        }, 2000)
    }, 100)
}

function generateUniqueId() {
    return `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function isValidColor(color) {
    const s = new Option().style
    s.color = color
    return s.color !== ''
}

function copyToClipboard(text) {
    // Modern browsers
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard
            .writeText(text)
            .then(() => showNotification('Copied to clipboard!'))
            .catch(err =>
                showNotification('Failed to copy to clipboard', 'error')
            )
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()

    try {
        document.execCommand('copy')
        document.body.removeChild(textarea)
        showNotification('Copied to clipboard!')
    } catch (err) {
        document.body.removeChild(textarea)
        showNotification('Failed to copy to clipboard', 'error')
    }
}

function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

function getPreferredColorScheme() {
    if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
        return 'dark'
    }
    return 'light'
}

// Error handling helper
function handleError(error, fallback) {
    console.error(error)
    if (typeof fallback === 'function') {
        try {
            fallback()
        } catch (fallbackError) {
            showNotification('An error occurred', 'error')
        }
    } else {
        showNotification('An error occurred', 'error')
    }
}

// Save and Load Functions
function saveConfiguration() {
    try {
        const config = getCurrentConfiguration()
        const savedConfigs = getSavedConfigurations()
        const configId = generateUniqueId()

        // Add new configuration
        savedConfigs[configId] = {
            ...config,
            name: `${config.icon} - ${new Date().toLocaleDateString()}`,
            timestamp: Date.now()
        }

        // Save to localStorage
        localStorage.setItem('iconStudioConfigs', JSON.stringify(savedConfigs))

        // Update saved configurations display
        updateSavedConfigsList()
        showNotification('Configuration saved successfully!')
    } catch (error) {
        handleError(error)
    }
}

function getSavedConfigurations() {
    try {
        const saved = localStorage.getItem('iconStudioConfigs')
        return saved ? JSON.parse(saved) : {}
    } catch (error) {
        handleError(error)
        return {}
    }
}

function loadConfiguration(configId) {
    try {
        const savedConfigs = getSavedConfigurations()
        const config = savedConfigs[configId]

        if (!validateConfiguration(config)) {
            throw new Error('Invalid configuration')
        }

        // Switch library if needed
        if (config.library !== currentLibrary) {
            switchLibrary(config.library)
        }

        // Update family if needed
        if (config.family !== currentFamily) {
            currentFamily = config.family
            updateFamilyButtons()
        }

        // Set colors
        document.getElementById('primaryColor').value = config.primaryColor
        document.getElementById('secondaryColor').value = config.secondaryColor

        // Update color pickers
        const primaryPickr = Pickr.getInstance('#primaryColorPicker')
        const secondaryPickr = Pickr.getInstance('#secondaryPicker')
        if (primaryPickr) primaryPickr.setColor(config.primaryColor)
        if (secondaryPickr) secondaryPickr.setColor(config.secondaryColor)

        // Set slider values
        setSliderValue('weightSlider', config.weight)
        setSliderValue('fillSlider', config.fill)
        setSliderValue('gradeSlider', config.grade)
        setSliderValue('sizeSlider', config.size)
        setSliderValue('offsetSlider', config.offset)
        setSliderValue('opacitySlider', config.opacity)

        // Set effects
        document.querySelectorAll('.effect-option').forEach(option => {
            option.classList.toggle(
                'active',
                config.effects.includes(option.dataset.effect)
            )
        })

        // Select icon
        selectedIcon = config.icon
        updatePreview()

        showNotification('Configuration loaded successfully!')
    } catch (error) {
        handleError(error)
    }
}

function deleteConfiguration(configId) {
    try {
        const savedConfigs = getSavedConfigurations()
        delete savedConfigs[configId]
        localStorage.setItem('iconStudioConfigs', JSON.stringify(savedConfigs))
        updateSavedConfigsList()
        showNotification('Configuration deleted')
    } catch (error) {
        handleError(error)
    }
}

function updateSavedConfigsList() {
    const container = document.querySelector('.saved-icons')
    if (!container) {
        console.warn('Saved icons container not found')
        return
    }

    const configs = getSavedConfigurations()

    // Clear and initialize container
    try {
        container.innerHTML = '<h3>Saved Configurations</h3>'

        if (Object.keys(configs).length === 0) {
            container.innerHTML +=
                '<p class="no-saves">No saved configurations</p>'
            return
        }

        const list = document.createElement('div')
        list.className = 'saved-configs-list'

        Object.entries(configs)
            .sort(([, a], [, b]) => b.timestamp - a.timestamp)
            .forEach(([id, config]) => {
                const item = document.createElement('div')
                item.className = 'saved-config-item'
                item.innerHTML = `
                <span class="config-icon">
                    ${config.library === 'material'
                        ? `<span class="material-symbols-${config.family}">${config.icon}</span>`
                        : `<i class="fa-${config.family} fa-${config.icon}"></i>`
                    }
                </span>
                <span class="config-name">${config.name}</span>
                <div class="config-actions">
                    <button class="button" onclick="loadConfiguration('${id}')">Load</button>
                    <button class="button delete" onclick="deleteConfiguration('${id}')">Delete</button>
                </div>
            `
                list.appendChild(item)
            })

        container.appendChild(list)
    } catch (error) {
        console.error('Error updating saved configs list:', error)
    }
}

// Add this to your initialization
function initializeSavedConfigs() {
    updateSavedConfigsList()
}

// Export Functions
function showExportModal() {
    const modal = document.getElementById('exportModal')
    const themeCode = generateThemeCSS()
    document.getElementById('themeCode').textContent = themeCode
    modal.classList.add('active')
}


function generateMaterialThemeCSS(config) {
    return `/* Material Symbols Base Styles */
.material-symbols-${config.family} {
font-variation-settings: 
    'FILL' ${config.fill},
    'wght' ${config.weight},
    'GRAD' ${config.grade},
    'opsz' ${config.size};
}

/* Two-tone Effect Base */
.material-symbols-${config.family}.two-tone {
position: relative;
display: inline-block;
color: ${config.primaryColor};
}

.material-symbols-${config.family}.two-tone::after {
content: attr(data-icon);
position: absolute;
left: ${config.offset}px;
top: ${config.offset}px;
color: ${config.secondaryColor};
z-index: -1;
}\n`
}

function generateFontAwesomeThemeCSS(config) {
    return `/* Font Awesome Base Styles */
.fa-${config.family}.two-tone-wrapper {
position: relative;
display: inline-block;
}

.fa-${config.family}.two-tone {
color: ${config.primaryColor};
}

.fa-${config.family}.two-tone-secondary {
position: absolute;
left: ${config.offset}px;
top: ${config.offset}px;
color: ${config.secondaryColor};
opacity: ${config.opacity};
z-index: -1;
}\n`
}

function generateEffectClassesCSS() {
    return `
/* Effect Classes */
.icon-shadow {
filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));
}

.icon-glow {
filter: drop-shadow(0 0 5px var(--icon-color, currentColor));
}

.icon-gradient {
background: linear-gradient(45deg, var(--icon-gradient-start, #000), var(--icon-gradient-end, #666));
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
}\n`
}

function copyCSS() {
    const cssCode = document.getElementById('cssCode').textContent
    copyToClipboard(cssCode)
}

function copyThemeCSS() {
    const themeCode = document.getElementById('themeCode').textContent
    copyToClipboard(themeCode)
}

function downloadThemeCSS() {
    const themeCode = document.getElementById('themeCode').textContent
    const config = getCurrentConfiguration()
    const filename = `icon-studio-theme-${config.library}-${config.family
        }-${selectedIcon}-${new Date().toISOString().split('T')[0]}.css`
    downloadFile(themeCode, filename, 'text/css')
}


function exportAsPNG(size) {
    if (!selectedIcon) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Get all current settings
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const offset = parseFloat(document.getElementById('offsetSlider').value);
    const weight = document.getElementById('weightSlider').value;
    const fill = parseInt(document.getElementById('fillSlider').value);
    const grade = document.getElementById('gradeSlider').value;
    const effects = Array.from(document.querySelectorAll('.effect-option.active'))
        .map(opt => opt.dataset.effect);

    const padding = effects.includes('glow') ? 40 : 20;
    canvas.width = size + (padding * 2);
    canvas.height = size + (padding * 2);

    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    function drawIcon(color, offsetX = 0, offsetY = 0) {
        ctx.save();

        if (currentLibrary === 'material') {
            ctx.font = `${size}px "Material Symbols ${currentFamily}"`;
            ctx.fontVariationSettings = `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
        } else {
            // Font Awesome handling
            const faFamily = currentFamily === 'solid' ? 'Free Solid' :
                currentFamily === 'regular' ? 'Free Regular' : 'Brands';
            ctx.font = `${size}px "Font Awesome 6 ${faFamily}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
        }

        const centerX = canvas.width / 2 + offsetX;
        const centerY = canvas.height / 2 + offsetY;

        // Handle gradient if active
        if (effects.includes('gradient')) {
            const direction = GRADIENT_DIRECTIONS[currentGradientAngle];
            if (direction) {
                const gradient = ctx.createLinearGradient(
                    canvas.width * direction.coords.start[0],
                    canvas.height * direction.coords.start[1],
                    canvas.width * direction.coords.end[0],
                    canvas.height * direction.coords.end[1]
                );
                gradient.addColorStop(0, primaryColor);
                gradient.addColorStop(1, secondaryColor);
                ctx.fillStyle = gradient;
            }
        } else {
            ctx.fillStyle = color;
        }

        // Handle rotation
        const rotation = parseInt(document.getElementById('rotateSlider').value);
        if (rotation !== 0) {
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        // Apply effects
        if (effects.includes('shadow')) {
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        if (effects.includes('glow')) {
            ctx.shadowColor = typeof color === 'string' ? color : primaryColor;
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Draw the icon
        if (currentLibrary === 'material') {
            ctx.fillText(selectedIcon, centerX, centerY);
        } else {
            // Create a temporary element to get the Font Awesome character
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'position:absolute;visibility:hidden;';
            tempDiv.innerHTML = `<i class="fa-${currentFamily} fa-${selectedIcon}"></i>`;
            document.body.appendChild(tempDiv);

            // Get the icon element and its computed style
            const iconElement = tempDiv.querySelector('i');
            const computedStyle = window.getComputedStyle(iconElement, ':before');
            const content = computedStyle.content;

            // Clean up
            document.body.removeChild(tempDiv);

            // Draw the character if we got valid content
            if (content && content !== 'none' && content !== '""') {
                const iconChar = content.replace(/['"]/g, '');
                ctx.fillText(iconChar, centerX, centerY);
            } else {
                console.error('Could not get Font Awesome character content');
            }
        }

        ctx.restore();
    }

    // Helper function for Font Awesome family names
    function getFontAwesomeFamily(family) {
        switch (family) {
            case 'solid':
                return 'Free Solid';
            case 'regular':
                return 'Free Regular';
            case 'brands':
                return 'Brands';
            default:
                return 'Free Solid';
        }
    }

    // Draw with effects
    if (effects.includes('gradient')) {
        drawIcon(null); // Gradient is handled inside drawIcon
    } else {
        drawIcon(secondaryColor, offset, offset);
        drawIcon(primaryColor);
    }

    // Create final canvas for proper cropping
    const finalCanvas = document.createElement('canvas');
    const finalSize = size + (effects.includes('glow') ? 40 : 0);
    finalCanvas.width = finalSize;
    finalCanvas.height = finalSize;
    const finalCtx = finalCanvas.getContext('2d');

    finalCtx.drawImage(
        canvas,
        padding / 2, padding / 2,
        canvas.width - padding, canvas.height - padding,
        0, 0, finalSize, finalSize
    );

    // Create download link
    const link = document.createElement('a');
    link.download = `icon-studio-${selectedIcon}-${size}x${size}.png`;
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
}


// Helper function to get proper Font Awesome family name
function getFontAwesomeFamily(family) {
    switch (family) {
        case 'solid':
            return 'Free Solid';
        case 'regular':
            return 'Free Regular';
        case 'brands':
            return 'Brands';
        default:
            return 'Free Solid';
    }
}

// Helper function to get icon unicode
function getIconUnicode(iconName, family) {
    // Make sure iconLibraries.fa contains the unicode values
    // This assumes your icons/fa_free_icons.json has unicode values
    const familyIcons = iconLibraries.fa[family];
    if (!familyIcons) return null;

    // Find the icon data - this structure depends on your JSON format
    const iconData = familyIcons.find(icon => {
        if (typeof icon === 'object') {
            return icon.name === iconName;
        }
        return false;
    });

    return iconData ? iconData.unicode : null;
}


function initializeAnimations() {
    // Update selector to match your HTML structure
    const animationButton = document.querySelector('.split-button .effect-option[data-effect="animation"]');
    if (!animationButton) {
        console.error('Animation button not found');
        return;
    }

    const animationList = animationButton.closest('.split-button').querySelector('.animation-list');
    if (!animationList) {
        console.error('Animation list not found');
        return;
    }

    let currentAnimation = 'none';

    // Toggle dropdown
    const dropdownTrigger = animationButton.closest('.split-button').querySelector('.dropdown-trigger');
    dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        animationList.classList.toggle('active');
    });

    // Handle animation selection
    animationList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            const animation = button.dataset.animation;
            currentAnimation = animation;

            // Update display
            document.getElementById('currentAnimation').textContent =
                animation === 'none' ? 'None' :
                    animation.charAt(0).toUpperCase() + animation.slice(1);

            // Update preview
            updatePreview();

            // Update working icons if auto-update is enabled
            if (document.getElementById('autoUpdateIcons').checked) {
                const config = getCurrentConfiguration();
                workingIconsManager.updateWithoutConfirm(config);
            }

            animationList.classList.remove('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        animationList.classList.remove('active');
    });
}


function initializeModals() {
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.classList.remove('active')
            }
        })
    })

    // Close button handling
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').classList.remove('active')
        })
    })

    // Export modal buttons
    document
        .getElementById('copyThemeBtn')
        .addEventListener('click', copyThemeCSS)
    document
        .getElementById('downloadThemeBtn')
        .addEventListener('click', downloadThemeCSS)
}