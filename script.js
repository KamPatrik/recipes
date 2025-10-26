// Recipe Collection App - JavaScript
class RecipeApp {
    constructor() {
        this.recipes = this.loadRecipes();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderRecipes();
        this.addSampleRecipes();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('recipe-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecipe();
        });

        // Add ingredient button
        document.getElementById('add-ingredient').addEventListener('click', () => {
            this.addIngredientField();
        });

        // Add instruction button
        document.getElementById('add-instruction').addEventListener('click', () => {
            this.addInstructionField();
        });

        // Search functionality
        document.getElementById('search-recipes').addEventListener('input', (e) => {
            this.filterRecipes(e.target.value);
        });

        // Filter functionality
        document.getElementById('filter-recipes').addEventListener('change', (e) => {
            this.filterByTime(e.target.value);
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('recipe-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('recipe-modal')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Data management event listeners
        document.getElementById('export-all-btn').addEventListener('click', () => {
            this.exportAllRecipes();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importRecipes(e.target.files[0]);
        });

        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.clearAllData();
        });
    }

    addIngredientField() {
        const container = document.getElementById('ingredients-container');
        const ingredientItem = document.createElement('div');
        ingredientItem.className = 'ingredient-item';
        ingredientItem.innerHTML = `
            <input type="text" name="ingredients" placeholder="Enter ingredient" required>
            <button type="button" class="remove-ingredient" onclick="removeIngredient(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(ingredientItem);
        ingredientItem.querySelector('input').focus();
    }

    addInstructionField() {
        const container = document.getElementById('instructions-container');
        const instructionItem = document.createElement('div');
        instructionItem.className = 'instruction-item';
        instructionItem.innerHTML = `
            <textarea name="instructions" placeholder="Enter step instruction" required></textarea>
            <button type="button" class="remove-instruction" onclick="removeInstruction(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(instructionItem);
        instructionItem.querySelector('textarea').focus();
    }

    addRecipe() {
        const form = document.getElementById('recipe-form');
        const formData = new FormData(form);
        
        // Get ingredients
        const ingredients = Array.from(document.querySelectorAll('input[name="ingredients"]'))
            .map(input => input.value.trim())
            .filter(ingredient => ingredient !== '');

        // Get instructions
        const instructions = Array.from(document.querySelectorAll('textarea[name="instructions"]'))
            .map(textarea => textarea.value.trim())
            .filter(instruction => instruction !== '');

        // Validate required fields
        if (!formData.get('name') || ingredients.length === 0 || instructions.length === 0) {
            alert('Please fill in all required fields: Recipe name, at least one ingredient, and at least one instruction.');
            return;
        }

        const recipe = {
            id: Date.now().toString(),
            name: formData.get('name'),
            description: formData.get('description') || '',
            prepTime: parseInt(formData.get('prepTime')) || 0,
            cookTime: parseInt(formData.get('cookTime')) || 0,
            servings: parseInt(formData.get('servings')) || 1,
            ingredients: ingredients,
            instructions: instructions,
            imageUrl: formData.get('imageUrl') || '',
            createdAt: new Date().toISOString()
        };

        this.recipes.push(recipe);
        this.saveRecipes();
        this.renderRecipes();
        this.resetForm();
        
        // Show success message
        this.showNotification('Recipe added successfully!', 'success');
    }

    resetForm() {
        document.getElementById('recipe-form').reset();
        
        // Reset ingredients to one field
        const ingredientsContainer = document.getElementById('ingredients-container');
        ingredientsContainer.innerHTML = `
            <div class="ingredient-item">
                <input type="text" name="ingredients" placeholder="Enter ingredient" required>
                <button type="button" class="remove-ingredient" onclick="removeIngredient(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Reset instructions to one field
        const instructionsContainer = document.getElementById('instructions-container');
        instructionsContainer.innerHTML = `
            <div class="instruction-item">
                <textarea name="instructions" placeholder="Enter step instruction" required></textarea>
                <button type="button" class="remove-instruction" onclick="removeInstruction(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    renderRecipes() {
        const container = document.getElementById('recipes-container');
        const noRecipes = document.getElementById('no-recipes');
        
        if (this.recipes.length === 0) {
            container.innerHTML = '';
            noRecipes.style.display = 'block';
            return;
        }

        noRecipes.style.display = 'none';
        
        container.innerHTML = this.recipes.map(recipe => this.createRecipeCard(recipe)).join('');
        
        // Add event listeners to recipe cards
        container.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.recipe-actions')) {
                    const recipeId = card.dataset.recipeId;
                    this.showRecipeModal(recipeId);
                }
            });
        });

        // Add event listeners to action buttons
        container.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = btn.closest('.recipe-card').dataset.recipeId;
                this.showRecipeModal(recipeId);
            });
        });

        container.querySelectorAll('.btn-export').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = btn.closest('.recipe-card').dataset.recipeId;
                this.exportSingleRecipe(recipeId);
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = btn.closest('.recipe-card').dataset.recipeId;
                this.deleteRecipe(recipeId);
            });
        });
    }

    createRecipeCard(recipe) {
        const totalTime = recipe.prepTime + recipe.cookTime;
        const timeCategory = totalTime < 30 ? 'quick' : totalTime < 60 ? 'medium' : 'long';
        
        return `
            <div class="recipe-card fade-in" data-recipe-id="${recipe.id}" data-time-category="${timeCategory}">
                ${recipe.imageUrl ? 
                    `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="recipe-image" onerror="this.style.display='none'">` : 
                    '<div class="recipe-image"></div>'
                }
                <div class="recipe-content">
                    <h3 class="recipe-title">${this.escapeHtml(recipe.name)}</h3>
                    <p class="recipe-description">${this.escapeHtml(recipe.description)}</p>
                    <div class="recipe-meta">
                        <div class="recipe-time">
                            <i class="fas fa-clock"></i>
                            <span>${totalTime} min</span>
                        </div>
                        <div class="recipe-servings">
                            <i class="fas fa-users"></i>
                            <span>${recipe.servings} serving${recipe.servings !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div class="recipe-actions">
                        <button class="btn-view">View Recipe</button>
                        <button class="btn-export">Export</button>
                        <button class="btn-delete">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    showRecipeModal(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const modal = document.getElementById('recipe-modal');
        const modalContent = document.getElementById('modal-content');
        
        modalContent.innerHTML = this.createModalContent(recipe);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    createModalContent(recipe) {
        const totalTime = recipe.prepTime + recipe.cookTime;
        
        return `
            <div class="modal-recipe">
                ${recipe.imageUrl ? 
                    `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="modal-recipe-image" onerror="this.style.display='none'">` : 
                    ''
                }
                <h2 class="modal-recipe-title">${this.escapeHtml(recipe.name)}</h2>
                <p class="modal-recipe-description">${this.escapeHtml(recipe.description)}</p>
                
                <div class="modal-recipe-meta">
                    <div class="modal-meta-item">
                        <i class="fas fa-clock" style="color: #e74c3c;"></i>
                        <div class="meta-label">Prep Time</div>
                        <div class="meta-value">${recipe.prepTime} min</div>
                    </div>
                    <div class="modal-meta-item">
                        <i class="fas fa-fire" style="color: #f39c12;"></i>
                        <div class="meta-label">Cook Time</div>
                        <div class="meta-value">${recipe.cookTime} min</div>
                    </div>
                    <div class="modal-meta-item">
                        <i class="fas fa-clock" style="color: #3498db;"></i>
                        <div class="meta-label">Total Time</div>
                        <div class="meta-value">${totalTime} min</div>
                    </div>
                    <div class="modal-meta-item">
                        <i class="fas fa-users" style="color: #27ae60;"></i>
                        <div class="meta-label">Servings</div>
                        <div class="meta-value">${recipe.servings}</div>
                    </div>
                </div>

                <div class="modal-section">
                    <h3><i class="fas fa-list"></i> Ingredients</h3>
                    <ul class="modal-ingredients">
                        ${recipe.ingredients.map(ingredient => 
                            `<li>${this.escapeHtml(ingredient)}</li>`
                        ).join('')}
                    </ul>
                </div>

                <div class="modal-section">
                    <h3><i class="fas fa-list-ol"></i> Instructions</h3>
                    <ol class="modal-instructions">
                        ${recipe.instructions.map(instruction => 
                            `<li>${this.escapeHtml(instruction)}</li>`
                        ).join('')}
                    </ol>
                </div>
            </div>
        `;
    }

    closeModal() {
        const modal = document.getElementById('recipe-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    deleteRecipe(recipeId) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            this.recipes = this.recipes.filter(recipe => recipe.id !== recipeId);
            this.saveRecipes();
            this.renderRecipes();
            this.showNotification('Recipe deleted successfully!', 'success');
        }
    }

    filterRecipes(searchTerm) {
        const cards = document.querySelectorAll('.recipe-card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(card => {
            const title = card.querySelector('.recipe-title').textContent.toLowerCase();
            const description = card.querySelector('.recipe-description').textContent.toLowerCase();
            const ingredients = Array.from(card.querySelectorAll('.recipe-meta')).map(meta => meta.textContent.toLowerCase()).join(' ');
            
            if (title.includes(term) || description.includes(term) || ingredients.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    filterByTime(timeCategory) {
        const cards = document.querySelectorAll('.recipe-card');
        
        cards.forEach(card => {
            if (timeCategory === '' || card.dataset.timeCategory === timeCategory) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    addSampleRecipes() {
        if (this.recipes.length === 0) {
            const sampleRecipes = [
                {
                    id: '1',
                    name: 'Classic Spaghetti Carbonara',
                    description: 'A traditional Italian pasta dish with eggs, cheese, and pancetta.',
                    prepTime: 10,
                    cookTime: 20,
                    servings: 4,
                    ingredients: [
                        '400g spaghetti',
                        '200g pancetta or guanciale',
                        '4 large eggs',
                        '100g Pecorino Romano cheese',
                        '2 cloves garlic',
                        'Black pepper',
                        'Salt'
                    ],
                    instructions: [
                        'Bring a large pot of salted water to boil and cook spaghetti according to package directions.',
                        'Cut pancetta into small cubes and cook in a large skillet until crispy.',
                        'In a bowl, whisk together eggs, grated cheese, and black pepper.',
                        'Drain pasta, reserving 1 cup of pasta water.',
                        'Add hot pasta to the skillet with pancetta and toss.',
                        'Remove from heat and quickly stir in egg mixture, adding pasta water as needed.',
                        'Serve immediately with extra cheese and black pepper.'
                    ],
                    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Chocolate Chip Cookies',
                    description: 'Soft and chewy homemade chocolate chip cookies that are perfect for any occasion.',
                    prepTime: 15,
                    cookTime: 12,
                    servings: 24,
                    ingredients: [
                        '2 1/4 cups all-purpose flour',
                        '1 tsp baking soda',
                        '1 tsp salt',
                        '1 cup butter, softened',
                        '3/4 cup granulated sugar',
                        '3/4 cup brown sugar',
                        '2 large eggs',
                        '2 tsp vanilla extract',
                        '2 cups chocolate chips'
                    ],
                    instructions: [
                        'Preheat oven to 375°F (190°C).',
                        'Mix flour, baking soda, and salt in a bowl.',
                        'In another bowl, cream butter and both sugars until fluffy.',
                        'Beat in eggs and vanilla.',
                        'Gradually blend in flour mixture.',
                        'Stir in chocolate chips.',
                        'Drop rounded tablespoons onto ungreased cookie sheets.',
                        'Bake 9-11 minutes until golden brown.',
                        'Cool on baking sheet for 2 minutes before removing.'
                    ],
                    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500',
                    createdAt: new Date().toISOString()
                }
            ];
            
            this.recipes = sampleRecipes;
            this.saveRecipes();
            this.renderRecipes();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db',
            warning: '#f39c12'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveRecipes() {
        localStorage.setItem('recipeCollection', JSON.stringify(this.recipes));
    }

    loadRecipes() {
        const saved = localStorage.getItem('recipeCollection');
        return saved ? JSON.parse(saved) : [];
    }

    // File Management Methods
    exportSingleRecipe(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const recipeData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            recipe: recipe
        };

        this.downloadFile(
            JSON.stringify(recipeData, null, 2),
            `${this.sanitizeFileName(recipe.name)}.json`,
            'application/json'
        );

        this.showNotification(`Recipe "${recipe.name}" exported successfully!`, 'success');
    }

    exportAllRecipes() {
        if (this.recipes.length === 0) {
            this.showNotification('No recipes to export!', 'info');
            return;
        }

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalRecipes: this.recipes.length,
            recipes: this.recipes
        };

        this.downloadFile(
            JSON.stringify(exportData, null, 2),
            `recipe-collection-backup-${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
        );

        this.showNotification(`Exported ${this.recipes.length} recipes successfully!`, 'success');
    }

    importRecipes(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.version && data.recipes) {
                    // Full collection import
                    this.handleFullImport(data);
                } else if (data.version && data.recipe) {
                    // Single recipe import
                    this.handleSingleImport(data);
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing file: Invalid format', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }

    handleFullImport(data) {
        const importedRecipes = data.recipes;
        const existingIds = new Set(this.recipes.map(r => r.id));
        
        // Filter out recipes that already exist (by ID)
        const newRecipes = importedRecipes.filter(recipe => !existingIds.has(recipe.id));
        
        if (newRecipes.length === 0) {
            this.showNotification('No new recipes to import (all recipes already exist)', 'info');
            return;
        }

        // Add new recipes
        this.recipes.push(...newRecipes);
        this.saveRecipes();
        this.renderRecipes();
        
        this.showNotification(`Imported ${newRecipes.length} new recipes successfully!`, 'success');
    }

    handleSingleImport(data) {
        const recipe = data.recipe;
        const existingRecipe = this.recipes.find(r => r.id === recipe.id);
        
        if (existingRecipe) {
            if (confirm(`Recipe "${recipe.name}" already exists. Do you want to replace it?`)) {
                const index = this.recipes.findIndex(r => r.id === recipe.id);
                this.recipes[index] = recipe;
                this.saveRecipes();
                this.renderRecipes();
                this.showNotification(`Recipe "${recipe.name}" updated successfully!`, 'success');
            }
        } else {
            this.recipes.push(recipe);
            this.saveRecipes();
            this.renderRecipes();
            this.showNotification(`Recipe "${recipe.name}" imported successfully!`, 'success');
        }
    }

    clearAllData() {
        if (this.recipes.length === 0) {
            this.showNotification('No data to clear!', 'info');
            return;
        }

        if (confirm(`Are you sure you want to delete ALL ${this.recipes.length} recipes? This action cannot be undone!`)) {
            this.recipes = [];
            this.saveRecipes();
            this.renderRecipes();
            this.showNotification('All recipes deleted successfully!', 'success');
        }
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
    }

    sanitizeFileName(filename) {
        return filename
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }
}

// Global functions for HTML onclick handlers
function removeIngredient(button) {
    const container = document.getElementById('ingredients-container');
    if (container.children.length > 1) {
        button.parentElement.remove();
    }
}

function removeInstruction(button) {
    const container = document.getElementById('instructions-container');
    if (container.children.length > 1) {
        button.parentElement.remove();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RecipeApp();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
