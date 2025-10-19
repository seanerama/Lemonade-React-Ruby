# 🍋 Lemonade Stand Game - Complete Overview

## 📖 Introduction

Lemonade Stand is a business simulation game where you start with $50 and build a lemonade empire over a 90-day season. Make strategic decisions about recipes, pricing, inventory, and upgrades to maximize profits while adapting to weather, events, and customer demand.

## 🎯 Game Objectives

- **Primary Goal**: Maximize profit over a 90-day season
- **Strategic Elements**: Recipe quality, pricing strategy, inventory management, location selection
- **Long-term Planning**: Unlock upgrades, manage savings, optimize operations

## 🎮 Game Flow

```mermaid
graph TD
    A[Start: Day 1, $50] --> B[Home Office]
    B --> C{Choose Action}
    C --> D[Kitchen]
    C --> E[Shopping]
    C --> F[Sell at Location]
    C --> G[Manage Finances]

    D --> D1[Create Lemonade Batches]
    D1 --> D2[Mix Ingredients in Containers]
    D2 --> D3[Track Quality & Freshness]
    D3 --> B

    E --> E1[Buy Ingredients]
    E --> E2[Buy Containers]
    E --> E3[Purchase Upgrades]
    E1 --> B
    E2 --> B
    E3 --> B

    F --> F1[Select Location]
    F1 --> F2[Choose Batches to Sell]
    F2 --> F3[Set Prices]
    F3 --> F4[Selling Phase]
    F4 --> F5{Second Location?}
    F5 -->|No| H[Advance Day]
    F5 -->|Yes & Not Sold| F1
    F5 -->|Yes & Sold Both| H

    G --> G1[View Finances]
    G --> G2[Transfer Tips Savings]
    G1 --> B
    G2 --> B

    H --> H1[Move Tips to Savings]
    H1 --> H2[Calculate 2.5% Interest]
    H2 --> H3[Age Batches]
    H3 --> H4[Update Weather]
    H4 --> H5[Trigger Events]
    H5 --> I{Day 90?}
    I -->|No| B
    I -->|Yes| J[Game Over - Final Score]
```

## 🏠 Game Screens

### 1. Home Office

Your central hub for managing the business.

**Available Actions:**
- 🍋 **Kitchen** - Create lemonade batches
- 🛒 **Shopping** - Buy supplies and upgrades
- 📍 **Locations** - View and select selling locations
- 💰 **View Finances** - Detailed financial breakdown

**Information Displayed:**
- Current date and day number
- Business cash on hand
- Tips savings account (with interest preview)
- Weather forecast
- Daily news and active events
- Inventory summary
- Lemonade batch status

```mermaid
graph LR
    A[Home Office] --> B[Kitchen]
    A --> C[Shopping]
    A --> D[Locations]
    A --> E[Tips Management]

    E --> E1[Tips Savings: 2.5% Daily Interest]
    E1 --> E2[One-way Transfer to Business]
```

### 2. Kitchen

Create and manage lemonade batches.

**Core Mechanics:**

```mermaid
graph TD
    A[Select Container Type] --> B[Choose Recipe]
    B --> C[Cup: 20 servings]
    B --> D[Pitcher: 40 servings]
    B --> E[Cooler: 120 servings]
    B --> F[Barrel: 250 servings]

    C --> G[Mix Ingredients]
    D --> G
    E --> G
    F --> G

    G --> H[Calculate Quality Score]
    H --> I[Track Creation Date]
    I --> J[Add to Inventory]

    J --> K{Container Reuse}
    K -->|Uses < 3| L[Can Combine Later]
    K -->|Uses = 3| M[Cannot Reuse]
```

**Recipe Quality Formula:**
```
Quality Score = (Lemons × 2 + Sugar × 1.5 + Ice × 1) / 10
- Lemons: Most impactful (weight: 2)
- Sugar: Moderate impact (weight: 1.5)
- Ice: Least impact (weight: 1)
```

**Container System:**
- Each container can be reused up to 3 times
- Combine multiple batches to consolidate inventory
- Combined batch inherits oldest creation date
- Empty containers returned to inventory (minus one)

**Batch Aging:**
- Fresh (0-2 days): Full quality
- Aging (3-4 days): Quality penalty
- Old (5+ days): Significant quality penalty

### 3. Shopping

Purchase supplies and upgrades to improve your business.

**Categories:**

```mermaid
graph TD
    A[Shopping] --> B[Ingredients]
    A --> C[Containers]
    A --> D[Upgrades]

    B --> B1[Lemons: $0.25 each]
    B --> B2[Sugar: $0.15 each]
    B --> B3[Ice: $0.10 each]

    C --> C1[Cup: $0.50]
    C --> C2[Pitcher: $2.00]
    C --> C3[Cooler: $8.00]
    C --> C4[Barrel: $15.00]

    D --> D1[Permanent Upgrades]
    D --> D2[Temporary Upgrades]

    D1 --> D11[Juicer: +10% quality]
    D1 --> D12[Insulated Containers: +1 day freshness]
    D1 --> D13[Premium Ingredients: +15% quality]
    D1 --> D14[Second Location: Sell twice/day]

    D2 --> D21[Advertising: +50% customers, 1 day]
    D2 --> D22[Double Tips: 2x tips, 1 day]
```

**Upgrade System:**
- **Permanent Upgrades**: One-time purchase, permanent effect
- **Temporary Upgrades**: Active for 1 day only
- Some upgrades stack with others

### 4. Locations

Choose where to sell your lemonade.

```mermaid
graph TD
    A[Select Location] --> B[Residential]
    A --> C[Park]
    A --> D[Beach]
    A --> E[Downtown]

    B --> B1[Base: 50-80 customers]
    B1 --> B2[Moderate traffic]
    B1 --> B3[Price sensitive]

    C --> C1[Base: 80-120 customers]
    C1 --> C2[High traffic]
    C1 --> C3[Weather dependent]

    D --> D1[Base: 100-150 customers]
    D1 --> D2[Very high traffic]
    D1 --> D3[Hot weather bonus]

    E --> E1[Base: 60-100 customers]
    E1 --> E2[Business crowd]
    E1 --> E3[Less price sensitive]
```

**Location Characteristics:**
- Different base customer counts
- Weather sensitivity varies
- Event impact differs by location
- Traffic patterns unique to each

### 5. Selling Phase

The core gameplay loop where you serve customers.

```mermaid
sequenceDiagram
    participant P as Player
    participant G as Game
    participant C as Customers

    P->>G: Select batches
    P->>G: Set cup & pitcher prices
    P->>G: Start selling

    loop Each Customer
        G->>C: Generate customer
        C->>G: Price tolerance check
        alt Accepts price
            C->>G: Purchase
            G->>P: Add revenue
            G->>P: Add tips (maybe)
        else Rejects price
            C->>G: Walk away
        end
        G->>G: Reduce batch servings
        G->>G: Check if sold out
    end

    G->>P: Show results
    G->>G: Check if day advances
```

**Selling Mechanics:**

1. **Customer Generation**: Random customers with varying price tolerances
2. **Price Check**: Customer compares price to their tolerance
3. **Quality Impact**: Higher quality = higher tolerance
4. **Purchase**: Deduct servings, add revenue
5. **Tips**: Random chance based on quality and service
6. **Batch Depletion**: Automatically switch to next batch when empty

**Pricing Strategy:**
- Too high: Customers walk away
- Too low: Profit margin suffers
- Optimal: Balance volume and margin
- Weather/events affect optimal pricing

## 🌤 Weather System

Weather significantly impacts customer behavior and demand.

```mermaid
graph TD
    A[Weather Types] --> B[Sunny ☀️]
    A --> C[Cloudy ☁️]
    A --> D[Rainy 🌧️]
    A --> E[Hot 🔥]

    B --> B1[+50% customers]
    B --> B2[Temperature: 75-85°F]

    C --> C1[Normal customers]
    C --> C2[Temperature: 65-75°F]

    D --> D1[-30% customers]
    D --> D2[Temperature: 60-70°F]

    E --> E1[+100% customers]
    E --> E2[Temperature: 90-100°F]
    E --> E3[Higher prices accepted]
```

**Weather Effects:**
- **Temperature**: Affects customer demand
- **Conditions**: Multiplier on customer count
- **Forecast**: Plan ahead with 3-day forecast

## 🎪 Events System

Random events create opportunities and challenges.

```mermaid
graph TD
    A[Event Types] --> B[Convention]
    A --> C[Stadium Event]
    A --> D[Downtown Festival]
    A --> E[Heatwave]

    B --> B1[Duration: 1 day]
    B --> B2[Location: Downtown]
    B --> B3[+200 customers]

    C --> C1[Duration: 1 day]
    C --> C2[Location: Park]
    C --> C3[+150 customers]

    D --> D1[Duration: 2 days]
    D --> D2[Location: Downtown]
    D --> D3[+100 customers/day]

    E --> E1[Duration: 3-5 days]
    E --> E2[All locations]
    E --> E3[Extreme heat weather]
    E --> E4[+50% demand]
```

**Event Strategy:**
- Plan inventory for high-demand days
- Stock up on containers before events
- Adjust pricing for increased demand
- Choose optimal locations during events

## 💰 Financial System

```mermaid
graph TD
    A[Revenue Streams] --> B[Lemonade Sales]
    A --> C[Customer Tips]

    B --> D[Business Account]
    C --> E[Tip Jar]

    E --> F[End of Day]
    F --> G[Tips Savings Account]

    G --> H[Daily Interest: 2.5%]
    H --> I[Compound Interest]

    G --> J[One-way Transfer]
    J --> D

    D --> K[Expenses]
    K --> K1[Ingredients]
    K --> K2[Containers]
    K --> K3[Upgrades]
```

**Money Management:**
- **Business Account**: Main operating cash
- **Tip Jar**: Accumulated tips during day
- **Tips Savings**: 2.5% daily compound interest
- **Transfer**: Can move savings → business (not reversible)

**Interest Calculation:**
```
Daily Interest = Tips Savings Balance × 0.025
New Balance = Old Balance + Interest + New Tips
```

## 🎓 Strategy Guide

### Early Game (Days 1-20)

1. **Start Small**: Use cups and pitchers
2. **Buy Ingredients in Bulk**: Lower per-unit cost
3. **Focus on Quality**: Build reputation
4. **Save for Upgrades**: Juicer first for quality boost
5. **Watch Weather**: Plan 1-2 days ahead

### Mid Game (Days 21-60)

1. **Scale Up**: Use coolers and barrels
2. **Unlock Second Location**: Double daily revenue
3. **Build Tips Savings**: Let interest compound
4. **Optimize Recipes**: Find quality/cost balance
5. **React to Events**: Maximize event days

### Late Game (Days 61-90)

1. **Maximize Volume**: Serve as many as possible
2. **Premium Pricing**: You have reputation
3. **Use Container Reuse**: Efficiency matters
4. **Leverage Savings**: Transfer as needed for big purchases
5. **Plan Endgame**: Strong finish for high score

## 📊 Key Metrics

### Performance Indicators

```mermaid
graph LR
    A[Success Metrics] --> B[Total Revenue]
    A --> C[Profit Margin]
    A --> D[Customer Satisfaction]
    A --> E[Inventory Efficiency]

    B --> B1[Sales per day]
    C --> C1[Revenue - Costs]
    D --> D1[Tips received]
    E --> E1[Waste minimized]
```

**Tracking Progress:**
- Daily revenue trends
- Cost per serving
- Tips as % of revenue
- Batch waste (expired/unsold)
- Customer walkaway rate

## 🔄 Day Advancement Logic

```mermaid
graph TD
    A[Complete Selling] --> B{Second Location Upgrade?}
    B -->|No| C[Advance Day]
    B -->|Yes| D{Sold Both Locations?}
    D -->|No| E[Return to Locations]
    D -->|Yes| C

    C --> F[Process Tips]
    F --> G[Transfer to Savings]
    G --> H[Calculate Interest]
    H --> I[Age Batches]
    I --> J[Update Weather]
    J --> K[Check Events]
    K --> L[Reset Daily Effects]
    L --> M[Increment Day Counter]
    M --> N{Day 90?}
    N -->|No| O[New Day Begins]
    N -->|Yes| P[Game Over]
```

## 🏆 Advanced Mechanics

### Container Combining System

```mermaid
graph TD
    A[Select Multiple Batches] --> B[Enter Combine Mode]
    B --> C[Select 2+ Batches]
    C --> D[Validate Same Container Type]
    D --> E[Calculate Combined Properties]

    E --> E1[Use Oldest Creation Date]
    E --> E2[Sum Servings]
    E --> E3[Weighted Average Quality]
    E --> E4[Max Container Uses + 1]

    E1 --> F[Create New Batch]
    E2 --> F
    E3 --> F
    E4 --> F

    F --> G[Remove Original Batches]
    G --> H[Return Containers - 1]
    H --> I{Max Uses Reached?}
    I -->|Yes: 3 uses| J[Container Destroyed]
    I -->|No: < 3 uses| K[Can Reuse Again]
```

**Combining Benefits:**
- Consolidate inventory
- Reduce container costs
- Simplify batch management
- Reuse containers efficiently

### Service Multiplier System

Permanent upgrades that increase serving speed:

```
Base Serve Rate = 1.0
+ Juicer: +0.2
+ Premium Ingredients: +0.15
+ Insulated Containers: +0.1
= Total Multiplier (affects customers served per day)
```

## 🎮 User Interface

### Home Office Layout

```
┌─────────────────────────────────────────────────┐
│  [Kitchen] [Shopping] [Locations] [Tips]        │
├─────────────────────────────────────────────────┤
│  📅 Day 15/90  🌡️ 78°F ☀️  💰 $245.50          │
├─────────────────────────────────────────────────┤
│  📰 News: Convention downtown tomorrow!          │
│  🌤️ Forecast: Sunny → Cloudy → Rainy           │
├─────────────────────────────────────────────────┤
│  ┌─────────────────┬─────────────────────────┐  │
│  │  Game Info      │  Inventory              │  │
│  │  - Money        │  - Lemons: 45           │  │
│  │  - Tips         │  - Sugar: 30            │  │
│  │  - Savings      │  - Ice: 60              │  │
│  └─────────────────┴─────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐│
│  │  Tips Savings Account                       ││
│  │  Balance: $125.00                           ││
│  │  Interest Preview: +$3.13 tomorrow          ││
│  │  [Transfer to Business]                     ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Selling Screen Layout

```
┌─────────────────────────────────────────────────┐
│  🍋 Park Location            [Change Location]  │
├─────────────────────────────────────────────────┤
│ 🌡️ 82°F | 👥 120 | 🍋 180 | 🚗 High | 💰 $180  │
├─────────────────────────────────────────────────┤
│  Step 1: Select Batches to Sell                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Cooler   │ │ Pitcher  │ │ Pitcher  │        │
│  │ 120 svgs │ │ 40 svgs  │ │ 35 svgs  │        │
│  │ Quality:8│ │ Quality:7│ │ Quality:9│        │
│  │ Fresh    │ │ 1 day old│ │ Fresh    │        │
│  └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────┤
│  Step 2: Set Your Prices                        │
│  Cup Price:    [$1.50]  Suggested: $1.25-$2.00 │
│  Pitcher Price: [$5.00]  Suggested: $4.00-$7.00│
├─────────────────────────────────────────────────┤
│  Ready to Sell?                                  │
│  ✓ 3 batches selected                           │
│  ✓ Prices configured                            │
│  ✓ 120 customers waiting                        │
│                                                  │
│           [🚀 Start Selling]                    │
└─────────────────────────────────────────────────┘
```

## 🎯 Win Conditions & Scoring

While there's no explicit "win" condition, success is measured by:

1. **Total Profit**: Revenue minus all expenses
2. **Final Net Worth**: Cash + Tips Savings + Inventory Value
3. **Efficiency**: Profit per day average
4. **Customer Satisfaction**: Total tips earned
5. **Waste Minimization**: Minimize expired batches

**Score Calculation:**
```
Final Score = (Cash + Tips Savings + Inventory Value) × 1.0
            + (Total Tips Earned) × 0.5
            - (Wasted Inventory Value) × 2.0
```

## 🔮 Future Considerations

Potential expansions and features:
- Employee management system
- Competing lemonade stands
- Marketing campaigns
- Recipe research and development
- Seasonal variations
- Multiplayer leaderboards
- Achievement system
- Story mode with objectives

---

**Ready to start your lemonade empire? See [README.md](README.md) for installation instructions!**
