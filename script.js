class Pokedex {
    constructor() {
        this.pokemonList = [];
        this.filteredPokemon = [];
        this.types = [];
        this.init();
    }

    async init() {
        await this.fetchAllPokemon();
        this.setupEventListeners();
        this.populateTypeFilter();
        this.displayPokemon();
    }

    async fetchAllPokemon() {
        const loadingDiv = document.getElementById('loadingDiv');
        const pokemonGrid = document.getElementById('pokemonGrid');
        
        try {
            for (let i = 1; i <= 151; i++) {
                loadingDiv.textContent = `Loading Pokémon ${i}/151...`;
                
                const [pokemonResponse, speciesResponse] = await Promise.all([
                    fetch(`https://pokeapi.co/api/v2/pokemon/${i}`),
                    fetch(`https://pokeapi.co/api/v2/pokemon-species/${i}`)
                ]);

                if (!pokemonResponse.ok || !speciesResponse.ok) {
                    throw new Error(`Failed to fetch Pokemon ${i}`);
                }

                const pokemonData = await pokemonResponse.json();
                const speciesData = await speciesResponse.json();

                const pokemon = {
                    id: pokemonData.id,
                    name: pokemonData.name,
                    types: pokemonData.types.map(type => type.type.name),
                    height: pokemonData.height / 10,
                    weight: pokemonData.weight / 10,
                    abilities: pokemonData.abilities.map(ability => 
                        ability.ability.name.replace('-', ' ')
                    ),
                    stats: pokemonData.stats.reduce((acc, stat) => {
                        acc[stat.stat.name] = stat.base_stat;
                        return acc;
                    }, {}),
                    sprite: pokemonData.sprites.front_default,
                    description: this.getEnglishDescription(speciesData.flavor_text_entries)
                };

                this.pokemonList.push(pokemon);
                
                // Collect unique types
                pokemon.types.forEach(type => {
                    if (!this.types.includes(type)) {
                        this.types.push(type);
                    }
                });
            }

            this.filteredPokemon = [...this.pokemonList];
            loadingDiv.style.display = 'none';
            pokemonGrid.style.display = 'grid';

        } catch (error) {
            console.error('Error fetching Pokemon data:', error);
            loadingDiv.textContent = 'Error loading Pokédex. Please refresh the page.';
        }
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

        searchInput.addEventListener('input', () => this.filterPokemon());
        typeFilter.addEventListener('change', () => this.filterPokemon());
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
            }
        });
        
        closeModal.addEventListener('click', () => this.closeModal());

        // Close modal with Escape key
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
                                pokemon.id.toString().includes(searchTerm);
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
                    <h3>Base Stats</h3>
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
                fill.style.width = fill.style.width; // Trigger reflow for animation
            });
        }, 100);
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        modalOverlay.style.display = 'none';
    }
}

// Initialize the Pokédex when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Pokedex();
});
