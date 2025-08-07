 python
```
import requests
import json
import pandas as pd
from datetime import datetime

class Gen1Pokedex:
    def __init__(self):
        self.base_url = 'https://pokeapi.co/api/v2/pokemon/'
        self.pokemon_data = []
    
    def fetch_pokemon_data(self, pokemon_id):
        """Fetch detailed data for a specific pokemon"""
        try:
            response = requests.get(f"{self.base_url}{pokemon_id}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for Pokemon {pokemon_id}: {e}")
            return None
    
    def get_pokemon_species_data(self, pokemon_id):
        """Get species data for flavor text and category"""
        try:
            species_url = f'https://pokeapi.co/api/v2/pokemon-species/{pokemon_id}/'
            response = requests.get(species_url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching species data for Pokemon {pokemon_id}: {e}")
            return None
    
    def extract_pokemon_info(self, pokemon_data, species_data=None):
        """Extract relevant information from pokemon data"""
        pokemon_info = {
            'id': pokemon_data['id'],
            'name': pokemon_data['name'].title(),
            'height': pokemon_data['height'] / 10,  # Convert to meters
            'weight': pokemon_data['weight'] / 10,  # Convert to kg
            'types': [t['type']['name'].title() for t in pokemon_data['types']],
            'abilities': [a['ability']['name'].replace('-', ' ').title() 
                         for a in pokemon_data['abilities']],
            'base_experience': pokemon_data['base_experience'],
            'stats': {stat['stat']['name']: stat['base_stat'] 
                     for stat in pokemon_data['stats']},
            'sprite_front': pokemon_data['sprites']['front_default'],
            'sprite_back': pokemon_data['sprites']['back_default'],
        }
        
        # Add species data if available
        if species_data:
            # Get English flavor text
            flavor_texts = species_data.get('flavor_text_entries', [])
            english_flavor = next((ft['flavor_text'] for ft in flavor_texts 
                                 if ft['language']['name'] == 'en'), 'No description available')
            pokemon_info['description'] = english_flavor.replace('\n', ' ').replace('\f', ' ')
            pokemon_info['category'] = species_data.get('genera', [{}])[0].get('genus', 'Unknown')
            pokemon_info['color'] = species_data.get('color', {}).get('name', 'Unknown')
        
        return pokemon_info
    
    def fetch_all_gen1_pokemon(self):
        """Fetch all 151 Generation 1 Pokemon"""
        print("Fetching Generation 1 Pokémon data...")
        
        for pokemon_id in range(1, 152):  # Gen 1 Pokemon IDs 1-151
            print(f"Fetching Pokemon #{pokemon_id:03d}...")
            
            # Get basic pokemon data
            pokemon_data = self.fetch_pokemon_data(pokemon_id)
            if not pokemon_data:
                continue
            
            # Get species data for additional info
            species_data = self.get_pokemon_species_data(pokemon_id)
            
            # Extract and store pokemon info
            pokemon_info = self.extract_pokemon_info(pokemon_data, species_data)
            self.pokemon_data.append(pokemon_info)
        
        print(f"Successfully fetched {len(self.pokemon_data)} Pokémon!")
        return self.pokemon_data
    
    def search_pokemon(self, query):
        """Search for Pokemon by name or ID"""
        results = []
        query = query.lower()
        
        for pokemon in self.pokemon_data:
            if (query in pokemon['name'].lower() or 
                query == str(pokemon['id']) or
                query in [t.lower() for t in pokemon['types']]):
                results.append(pokemon)
        
        return results
    
    def display_pokemon(self, pokemon):
        """Display formatted pokemon information"""
        print(f"\n{'='*50}")
        print(f"#{pokemon['id']:03d} - {pokemon['name']}")
        print(f"{'='*50}")
        print(f"Category: {pokemon.get('category', 'Unknown')}")
        print(f"Type(s): {' / '.join(pokemon['types'])}")
        print(f"Height: {pokemon['height']} m")
        print(f"Weight: {pokemon['weight']} kg")
        print(f"Color: {pokemon.get('color', 'Unknown')}")
        print(f"\nAbilities: {', '.join(pokemon['abilities'])}")
        print(f"Base Experience: {pokemon['base_experience']}")
        
        print(f"\nBase Stats:")
        for stat_name, stat_value in pokemon['stats'].items():
            print(f"  {stat_name.replace('-', ' ').title()}: {stat_value}")
        
        if 'description' in pokemon:
            print(f"\nDescription: {pokemon['description']}")
        
        print(f"\nSprites:")
        print(f"  Front: {pokemon['sprite_front']}")
        if pokemon['sprite_back']:
            print(f"  Back: {pokemon['sprite_back']}")
    
    def save_to_csv(self, filename='gen1_pokedex.csv'):
        """Save pokemon data to CSV file"""
        if not self.pokemon_data:
            print("No data to save. Please fetch data first.")
            return
        
        # Flatten the data for CSV
        csv_data = []
        for pokemon in self.pokemon_data:
            row = {
                'ID': pokemon['id'],
                'Name': pokemon['name'],
                'Type1': pokemon['types'][0] if pokemon['types'] else '',
                'Type2': pokemon['types'][1] if len(pokemon['types']) > 1 else '',
                'Height_m': pokemon['height'],
                'Weight_kg': pokemon['weight'],
                'Category': pokemon.get('category', ''),
                'Color': pokemon.get('color', ''),
                'Base_Experience': pokemon['base_experience'],
                'HP': pokemon['stats'].get('hp', 0),
                'Attack': pokemon['stats'].get('attack', 0),
                'Defense': pokemon['stats'].get('defense', 0),
                'Special_Attack': pokemon['stats'].get('special-attack', 0),
                'Special_Defense': pokemon['stats'].get('special-defense', 0),
                'Speed': pokemon['stats'].get('speed', 0),
                'Abilities': ', '.join(pokemon['abilities']),
                'Description': pokemon.get('description', ''),
                'Sprite_URL': pokemon['sprite_front']
            }
            csv_data.append(row)
        
        df = pd.DataFrame(csv_data)
        df.to_csv(filename, index=False)
        print(f"Data saved to {filename}")
    
    def save_to_json(self, filename='gen1_pokedex.json'):
        """Save pokemon data to JSON file"""
        if not self.pokemon_data:
            print("No data to save. Please fetch data first.")
            return
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.pokemon_data, f, indent=2, ensure_ascii=False)
        print(f"Data saved to {filename}")

# Usage example
if __name__ == "__main__":
    # Create pokedex instance
    pokedex = Gen1Pokedex()
    
    # Fetch all Generation 1 Pokemon data
    pokemon_list = pokedex.fetch_all_gen1_pokemon()
    
    # Search and display specific Pokemon
    print("\n" + "="*60)
    print("GENERATION 1 POKÉDEX")
    print("="*60)
    
    # Display first few Pokemon
    for i in range(5):
        pokedex.display_pokemon(pokemon_list[i])
    
    # Search functionality
    search_term = "pikachu"
    print(f"\n\nSearching for '{search_term}':")
    results = pokedex.search_pokemon(search_term)
    for result in results:
        pokedex.display_pokemon(result)
    
    # Save data
    pokedex.save_to_csv()
    pokedex.save_to_json()

```


JSX
```
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Pokedex.css';

const Pokedex = () => {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchAllPokemon();
  }, []);

  const fetchAllPokemon = async () => {
    setLoading(true);
    const pokemonData = [];
    
    for (let i = 1; i <= 151; i++) {
      try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${i}`);
        const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${i}`);
        
        const pokemon = {
          id: response.data.id,
          name: response.data.name,
          types: response.data.types.map(type => type.type.name),
          height: response.data.height / 10,
          weight: response.data.weight / 10,
          abilities: response.data.abilities.map(ability => ability.ability.name),
          stats: response.data.stats.reduce((acc, stat) => {
            acc[stat.stat.name] = stat.base_stat;
            return acc;
          }, {}),
          sprite: response.data.sprites.front_default,
          description: speciesResponse.data.flavor_text_entries
            .find(entry => entry.language.name === 'en')?.flavor_text || 'No description available'
        };
        
        pokemonData.push(pokemon);
      } catch (error) {
        console.error(`Error fetching Pokemon ${i}:`, error);
      }
    }
    
    setPokemonList(pokemonData);
    setLoading(false);
  };

  const filteredPokemon = pokemonList.filter(pokemon => {
    const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pokemon.id.toString().includes(searchTerm);
    const matchesType = typeFilter === 'all' || pokemon.types.includes(typeFilter);
    return matchesSearch && matchesType;
  });

  const types = [...new Set(pokemonList.flatMap(pokemon => pokemon.types))];

  if (loading) {
    return <div className="loading">Loading Pokédex...</div>;
  }

  return (
    <div className="pokedex-container">
      <h1 className="pokedex-title">Generation 1 Pokédex</h1>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Search Pokémon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="type-filter"
        >
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="pokemon-grid">
        {filteredPokemon.map(pokemon => (
          <div 
            key={pokemon.id} 
            className="pokemon-card"
            onClick={() => setSelectedPokemon(pokemon)}
          >
            <img src={pokemon.sprite} alt={pokemon.name} />
            <h3>#{pokemon.id.toString().padStart(3, '0')}</h3>
            <h2>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
            <div className="types">
              {pokemon.types.map(type => (
                <span key={type} className={`type ${type}`}>{type}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedPokemon && (
        <div className="modal-overlay" onClick={() => setSelectedPokemon(null)}>
          <div className="pokemon-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedPokemon(null)}>×</button>
            <img src={selectedPokemon.sprite} alt={selectedPokemon.name} />
            <h2>{selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}</h2>
            <p>#{selectedPokemon.id.toString().padStart(3, '0')}</p>
            
            <div className="pokemon-details">
              <div className="types">
                {selectedPokemon.types.map(type => (
                  <span key={type} className={`type ${type}`}>{type}</span>
                ))}
              </div>
              
              <div className="physical-stats">
                <p><strong>Height:</strong> {selectedPokemon.height} m</p>
                <p><strong>Weight:</strong> {selectedPokemon.weight} kg</p>
              </div>
              
              <div className="abilities">
                <strong>Abilities:</strong> {selectedPokemon.abilities.join(', ')}
              </div>
              
              <div className="base-stats">
                <h3>Base Stats</h3>
                {Object.entries(selectedPokemon.stats).map(([stat, value]) => (
                  <div key={stat} className="stat">
                    <span>{stat.replace('-', ' ').toUpperCase()}</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{width: `${(value / 255) * 100}%`}}
                      ></div>
                    </div>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              
              <p className="description">{selectedPokemon.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pokedex;

```
CSS
```
/* Pokedex.css */
.pokedex-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.pokedex-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 2.5em;
}

.loading {
  text-align: center;
  font-size: 1.5em;
  color: #7f8c8d;
  margin-top: 100px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  justify-content: center;
}

.search-input, .type-filter {
  padding: 10px;
  border: 2px solid #bdc3c7;
  border-radius: 5px;
  font-size: 16px;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.pokemon-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.pokemon-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.pokemon-card img {
  width: 120px;
  height: 120px;
}

.pokemon-card h2 {
  margin: 10px 0;
  color: #2c3e50;
}

.pokemon-card h3 {
  margin: 5px 0;
  color: #7f8c8d;
}

.types {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.type {
  padding: 5px 10px;
  border-radius: 15px;
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

/* Type colors */
.type.normal { background-color: #A8A878; }
.type.fire { background-color: #F08030; }
.type.water { background-color: #6890F0; }
.type.electric { background-color: #F8D030; }
.type.grass { background-color: #78C850; }
.type.ice { background-color: #98D8D8; }
.type.fighting { background-color: #C03028; }
.type.poison { background-color: #A040A0; }
.type.ground { background-color: #E0C068; }
.type.flying { background-color: #A890F0; }
.type.psychic { background-color: #F85888; }
.type.bug { background-color: #A8B820; }
.type.rock { background-color: #B8A038; }
.type.ghost { background-color: #705898; }
.type.dragon { background-color: #7038F8; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.pokemon-modal {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 30px;
  cursor: pointer;
  color: #7f8c8d;
}

.pokemon-details {
  margin-top: 20px;
}

.base-stats h3 {
  margin-bottom: 15px;
}

.stat {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.stat span:first-child {
  width: 120px;
  font-size: 12px;
  font-weight: bold;
}

.stat-bar {
  flex: 1;
  height: 10px;
  background-color: #ecf0f1;
  border-radius: 5px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background-color: #3498db;
  transition: width 0.3s ease;
}

.description {
  margin-top: 20px;
  line-height: 1.6;
  color: #34495e;
}

```