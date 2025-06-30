/*
  # Add Bitcoin Mining FAQ Content

  1. New Content
    - Add comprehensive Bitcoin mining FAQ content to the announcements table
    - Create a new announcement with detailed mining information
    - Set as published and featured for visibility

  2. Categories
    - Use 'education' category for the FAQ content
    - Ensure proper formatting for web display
*/

-- Insert comprehensive Bitcoin mining FAQ as an announcement
INSERT INTO announcements (
  title, 
  summary, 
  content, 
  category, 
  is_featured, 
  is_published, 
  published_at
) VALUES (
  'Bitcoin Mining: The Complete Guide',
  'Everything you need to know about Bitcoin mining - from basic concepts to advanced strategies, hardware selection, and profitability calculations.',
  '# Bitcoin Mining: The Complete Guide

## What is Bitcoin Mining?

Bitcoin mining is the process of creating new bitcoins by solving complex mathematical problems that verify transactions on the Bitcoin network. It serves two primary purposes:

1. **Transaction Verification**: Miners validate and confirm transactions on the blockchain
2. **New Bitcoin Creation**: The mining process releases new bitcoins into circulation

Mining is essentially a competition to solve complex mathematical puzzles. The first miner to solve the puzzle gets to add a new block of transactions to the blockchain and receives a reward in bitcoin.

## How Bitcoin Mining Works

1. **Transaction Verification**: When someone sends bitcoin, the transaction is broadcast to the network
2. **Block Creation**: Miners collect these transactions into blocks
3. **Proof of Work**: Miners compete to solve a mathematical puzzle (finding a hash that meets specific criteria)
4. **Block Addition**: The first miner to solve the puzzle adds their block to the blockchain
5. **Reward**: The winning miner receives newly created bitcoin (currently 3.125 BTC) plus transaction fees

## Mining Hardware

### ASIC Miners
Application-Specific Integrated Circuits (ASICs) are specialized devices designed solely for mining. They offer:
- Highest hashrates (100+ TH/s)
- Best energy efficiency (measured in J/TH)
- Higher upfront costs ($2,000-$15,000)
- Limited to specific algorithms (e.g., SHA-256 for Bitcoin)

Popular models include:
- Bitmain Antminer S19 XP, S21
- MicroBT WhatsMiner M50S, M60S
- Canaan AvalonMiner A1366

### GPU Mining
Graphics Processing Units can mine various cryptocurrencies but are less efficient for Bitcoin:
- More versatile (can mine different algorithms)
- Lower hashrates for Bitcoin (measured in GH/s)
- Higher electricity costs per hash
- Better for altcoins using different algorithms

### CPU Mining
Central Processing Units are no longer viable for Bitcoin mining:
- Extremely low hashrates
- Very high electricity costs per hash
- Inefficient compared to ASICs
- Only practical for certain altcoins or testing

## Mining Economics

### Key Factors Affecting Profitability
1. **Hardware Costs**: Initial investment in mining equipment
2. **Electricity Costs**: Ongoing operational expense (typically $0.05-$0.15/kWh)
3. **Bitcoin Price**: Directly impacts revenue
4. **Network Difficulty**: Increases as more miners join, reducing individual rewards
5. **Hashrate**: Your mining power relative to the network
6. **Block Reward**: Currently 3.125 BTC, halves approximately every four years

### Profitability Calculation
Basic formula: Revenue - Costs = Profit

- **Revenue** = (Your hashrate ÷ Network hashrate) × Blocks per day × Block reward × Bitcoin price
- **Costs** = Electricity cost + Hardware depreciation + Maintenance + Facility costs

### Mining Pools vs. Solo Mining

#### Mining Pools
- **Advantages**: Steady, predictable income; lower variance
- **Disadvantages**: Lower potential rewards; pool fees (1-3%)
- **Best for**: Miners with limited hashrate

#### Solo Mining
- **Advantages**: Full block rewards when successful; no pool fees
- **Disadvantages**: Highly unpredictable; may go long periods without rewards
- **Best for**: Miners with substantial hashrate or those willing to accept high variance

## Advanced Mining Concepts

### Network Difficulty
- Automatically adjusts every 2,016 blocks (approximately 2 weeks)
- Increases when more miners join the network
- Ensures blocks are found at a consistent rate (one every ~10 minutes)

### Mining Efficiency
- Measured in joules per terahash (J/TH)
- Lower is better (less energy per hash)
- Modern ASICs achieve 20-30 J/TH
- Critical for long-term profitability

### Hosting vs. Home Mining
- **Home Mining**: Lower operational costs but limited scale
- **Hosting**: Professional facilities with managed power and cooling
- **Colocation**: Renting space in a data center for your equipment

## Common Mining Challenges

### Heat Management
- ASICs generate significant heat (3,000-4,000W+)
- Requires proper ventilation and cooling
- Can increase electricity costs for air conditioning

### Noise Levels
- ASICs are extremely loud (70-90 dB)
- Comparable to vacuum cleaners or lawnmowers
- Challenging for residential settings

### Electricity Requirements
- Dedicated circuits often needed (20-30A, 240V)
- Home electrical systems may need upgrades
- Power stability is critical

## Mining Strategies

### Dollar-Cost Averaging
- Consistently mine regardless of market conditions
- Accumulate bitcoin over time
- Reduces impact of market volatility

### Speculative Mining
- Mine and hold bitcoin anticipating price appreciation
- Higher risk but potentially higher rewards
- Requires capital to cover operational costs

### Hybrid Approaches
- Sell a portion of mined bitcoin to cover costs
- Hold the remainder for long-term appreciation
- Balance immediate needs with future potential

## Environmental Considerations

### Energy Consumption
- Bitcoin mining uses substantial electricity
- Estimated at 100-150 TWh annually (comparable to some countries)
- Increasing focus on renewable energy sources

### Sustainable Mining
- Renewable energy: hydro, solar, wind, geothermal
- Utilizing stranded energy resources
- Heat recycling for other purposes (heating, agriculture)

## Regulatory Landscape

### Global Variations
- Policies range from supportive to prohibitive
- Some countries have banned mining (China)
- Others have embraced it (El Salvador, Texas)

### Compliance Considerations
- Power consumption regulations
- Noise ordinances
- Tax implications of mining income
- KYC/AML for commercial operations

## Getting Started with Mining

### For Beginners
1. **Research**: Understand the economics and technical requirements
2. **Start Small**: Consider cloud mining or rental options to learn
3. **Join Communities**: Connect with experienced miners for guidance
4. **Calculate Profitability**: Use mining calculators before investing

### For Experienced Miners
1. **Optimize Efficiency**: Focus on J/TH and electricity costs
2. **Scale Strategically**: Expand during market downturns when equipment is cheaper
3. **Diversify**: Consider multiple locations or mining strategies
4. **Stay Updated**: Follow technology developments and network changes

## The Future of Bitcoin Mining

### Technological Advancements
- More efficient ASICs (sub-20 J/TH)
- Immersion cooling for higher performance
- Integration with renewable energy systems

### Network Changes
- Block reward halving (next: 2028, reducing to 1.5625 BTC)
- Potential protocol upgrades
- Increasing transaction fees as block rewards diminish

### Industry Trends
- Institutional investment in mining operations
- Vertical integration (mining + energy production)
- Geographic diversification of mining operations

## Conclusion

Bitcoin mining remains a dynamic and evolving industry at the intersection of technology, economics, and energy. While the days of profitable mining on home computers are long gone, opportunities exist for those who approach mining strategically with the right equipment, energy costs, and operational expertise.

Whether you''re mining for profit, supporting the network, or accumulating bitcoin, understanding the fundamentals outlined in this guide will help you make informed decisions in your mining journey.',
  'education',
  true,
  true,
  now()
);

-- Create index for education category if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_announcements_education ON announcements(category) WHERE category = 'education';