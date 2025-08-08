class FastPokedex {
    constructor() {
        this.pokemonList = [];
        this.filteredPokemon = [];
        this.types = [];
        this.loadedCount = 0;
        this.init();
    }

    async init() {
        await this.fetchAllPokemonConcurrently();
        this.setupEventListeners();
        this.populateTypeFilter();
        this.displayPokemon();
    }

    // OPTIMIZED: Fetch multiple Pokemon concurrently in batches
    async fetchAllPokemonConcurrently() {
        const loadingDiv = document.getElementById('loadingDiv');
        const pokemonGrid = document.getElementById('pokemonGrid');
        const progressText = document.getElementById('loadingProgress');
        const progressFill = document.getElementById('progressFill');
        
        const BATCH_SIZE = 10; // Fetch 10 Pokemon at once for optimal performance
        const totalPokemon = 151;
        
        try {
            // Create batches of Pokemon IDs
            const batches = [];
            for (let i = 1; i <= totalPokemon; i += BATCH_SIZE) {
                const batch = [];
                for (let j = i; j < i + BATCH_SIZE && j <= totalPokemon; j++) {
                    batch.push(j);
                }
                batches.push(batch);
            }

            // Process each batch concurrently
            for (const batch of batches) {
                const batchPromises = batch.map(id => this.fetchSinglePokemon(id));
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Process successful results
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        this.pokemonList.push(result.value);
                        this.collectTypes(result.value.types);
                    } else {
                        console.warn(`Failed to fetch Pokemon #${batch[index]}`);
                    }
                    
                    this.loadedCount++;
                    this.updateProgress(progressText, progressFill, totalPokemon);
                });

                // Small delay between batches to prevent API rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Sort Pokemon by ID to maintain proper order
            this.pokemonList.sort((a, b) => a.id - b.id);
            this.filteredPokemon = [...this.pokemonList];
            
            loadingDiv.style.display = 'none';
            pokemonGrid.style.display = 'grid';

        } catch (error) {
            console.error('Error fetching Pokemon data:', error);
            loadingDiv.innerHTML = '<p>Error loading Pokédex. Please refresh the page.</p>';
        }
    }

    // OPTIMIZED: Single function to fetch both Pokemon and species data
    async fetchSinglePokemon(id) {
        try {
            const [pokemonResponse, speciesResponse] = await Promise.all([
                fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
                fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
            ]);

            if (!pokemonResponse.ok || !speciesResponse.ok) {
                throw new Error(`Failed to fetch Pokemon ${id}`);
            }

            const [pokemonData, speciesData] = await Promise.all([
                pokemonResponse.json(),
                speciesResponse.json()
            ]);

            return this.processPokemonData(pokemonData, speciesData);

        } catch (error) {
            console.error(`Error fetching Pokemon ${id}:`, error);
            return null;
        }
    }

    // OPTIMIZED: Process Pokemon data with base stat total calculation
    processPokemonData(pokemonData, speciesData) {
        const stats = pokemonData.stats.reduce((acc, stat) => {
            acc[stat.stat.name] = stat.base_stat;
            return acc;
        }, {});

        // Calculate base stat total
        const baseStatTotal = Object.values(stats).reduce((sum, stat) => sum + stat, 0);

        return {
            id: pokemonData.id,
            name: pokemonData.name,
            types: pokemonData.types.map(type => type.type.name),
            height: pokemonData.height / 10,
            weight: pokemonData.weight / 10,
            abilities: pokemonData.abilities.map(ability => 
                ability.ability.name.replace('-', ' ')
            ),
            stats: stats,
            baseStatTotal: baseStatTotal, // NEW: Base stat total
            sprite: pokemonData.sprites.front_default,
            description: this.getEnglishDescription(speciesData.flavor_text_entries)
        };
    }

    updateProgress(progressText, progressFill, total) {
        const percentage = (this.loadedCount / total) * 100;
        progressText.textContent = `${this.loadedCount}/${total}`;
        progressFill.style.width = `${percentage}%`;
    }

    collectTypes(types) {
        types.forEach(type => {
            if (!this.types.includes(type)) {
                this.types.push(type);
            }
        });
    }

    getEnglishDescription(flavorTextEntries) {
        const englishEntry = flavorTextEntries.find(entry => 
            entry.language.name === 'en'
        );
        return englishEntry ? 
            englishEntry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') : 
            'No description available';
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const typeFilter = document.getElementById('typeFilter');
        const modalOverlay = document.getElementById('modalOverlay');
        const closeModal = document.getElementById('closeModal');

        // OPTIMIZED: Debounced search for better performance
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.filterPokemon(), 300);
        });
        
        typeFilter.addEventListener('change', () => this.filterPokemon());
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
            }
        });
        
        closeModal.addEventListener('click', () => this.closeModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    populateTypeFilter() {
        const typeFilter = document.getElementById('typeFilter');
        this.types.sort().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            typeFilter.appendChild(option);
        });
    }

    filterPokemon() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value;

        this.filteredPokemon = this.pokemonList.filter(pokemon => {
            const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm) ||
                                pokemon.id.toString().includes(searchTerm) ||
                                pokemon.baseStatTotal.toString().includes(searchTerm);
            const matchesType = typeFilter === 'all' || pokemon.types.includes(typeFilter);
            return matchesSearch && matchesType;
        });

        this.displayPokemon();
    }

    displayPokemon() {
        const pokemonGrid = document.getElementById('pokemonGrid');
        pokemonGrid.innerHTML = '';

        this.filteredPokemon.forEach(pokemon => {
            const pokemonCard = this.createPokemonCard(pokemon);
            pokemonGrid.appendChild(pokemonCard);
        });
    }

    createPokemonCard(pokemon) {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.addEventListener('click', () => this.showPokemonDetails(pokemon));

        card.innerHTML = `
            <img src="${pokemon.sprite}" alt="${pokemon.name}" loading="lazy">
            <h3>#${pokemon.id.toString().padStart(3, '0')}</h3>
            <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
            <div class="base-stat-total">BST: ${pokemon.baseStatTotal}</div>
            <div class="types">
                ${pokemon.types.map(type => 
                    `<span class="type ${type}">${type}</span>`
                ).join('')}
            </div>
        `;

        return card;
    }

    showPokemonDetails(pokemon) {
        const modalContent = document.getElementById('modalContent');
        const modalOverlay = document.getElementById('modalOverlay');

        modalContent.innerHTML = `
            <div class="modal-pokemon-header">
                <img src="${pokemon.sprite}" alt="${pokemon.name}">
                <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
                <p>#${pokemon.id.toString().padStart(3, '0')}</p>
            </div>
            
            <div class="pokemon-details">
                <div class="types">
                    ${pokemon.types.map(type => 
                        `<span class="type ${type}">${type}</span>`
                    ).join('')}
                </div>
                
                <div class="physical-stats">
                    <p><strong>Height:</strong> ${pokemon.height} m</p>
                    <p><strong>Weight:</strong> ${pokemon.weight} kg</p>
                </div>
                
                <div class="abilities">
                    <strong>Abilities:</strong> ${pokemon.abilities.map(ability =>
                        ability.charAt(0).toUpperCase() + ability.slice(1)
                    ).join(', ')}
                </div>
                
                <div class="base-stats">
                    <h3>Base Stats <span class="total-stat">Total: ${pokemon.baseStatTotal}</span></h3>
                    ${Object.entries(pokemon.stats).map(([stat, value]) => `
                        <div class="stat">
                            <span>${stat.replace('-', ' ').toUpperCase()}</span>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: ${(value / 255) * 100}%"></div>
                            </div>
                            <span>${value}</span>
                        </div>
                    `).join('')}
                </div>
                
                <p class="description">${pokemon.description}</p>
            </div>
        `;

        modalOverlay.style.display = 'flex';
        
        // Animate stat bars
        setTimeout(() => {
            const statFills = modalContent.querySelectorAll('.stat-fill');
            statFills.forEach(fill => {
                fill.style.width = fill.style.width;
            });
        }, 100);
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        modalOverlay.style.display = 'none';
    }
}

// Initialize the Fast Pokédex when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FastPokedex();
});
