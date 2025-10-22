import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "apricot-helix",
        "name": "Apricot Helix",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Apricot OG x Helix",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 1,
        "thcRange": "20-25%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "Bred by Exotic Genetix, Apricot Helix is an indica-dominant hybrid known for its sweet and fruity apricot aroma with earthy undertones. It delivers a deeply relaxing and euphoric high that is great for unwinding. It's a parent of the popular Orange Apricot strain.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Apricot", "Sweet", "Earthy", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "blue-mammoth-auto",
        "name": "Blue Mammoth Auto",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20% (Autoflower)",
        "genetics": "Blueberry Skunk x Lowryder #1",
        "floweringType": "Autoflower",
        "thc": 12.5,
        "cbd": 1,
        "thcRange": "10-15%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10 (Lifecycle)",
        "description": "From Barney's Farm, Blue Mammoth Auto is a robust and high-yielding autoflowering strain. It combines Blueberry Skunk with Lowryder genetics for a fast and easy grow. The effect is deeply relaxing and calming, typical of a strong indica. Its aroma is a delicious blend of fruity, sweet berries with a skunky backbone.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "100-200 g/plant" },
            "heightDetails": { "indoor": "60-80 cm", "outdoor": "70-100 cm" }
        },
        "aromas": ["Berry", "Sweet", "Skunk", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "crystal-locomotive",
        "name": "Crystal Locomotive",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Trainwreck x White Widow",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Crystal Locomotive is a sativa-dominant hybrid that crosses two legendary strains, Trainwreck and White Widow. It is a parent of Mendo Montage. The result is a powerful strain with an uplifting, creative, and energetic high. Its aroma is a complex mix of earthy, piney, and spicy notes, true to its heritage.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Earthy", "Pine", "Spicy", "Woody"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "dabney-blue",
        "name": "Dabney Blue",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "DJ Short Blueberry x an unknown 90s Indica",
        "floweringType": "Photoperiod",
        "thc": 17.5,
        "cbd": 1,
        "thcRange": "15-20%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "Dabney Blue is a classic indica-dominant hybrid known for its rich blueberry flavor and relaxing effects. As a descendant of DJ Short's Blueberry, it delivers a happy and uplifting euphoria that gently fades into a calm body high. It is one of the parent strains of Lemon Berry.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Blueberry", "Berry", "Sweet", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "gooberry",
        "name": "Gooberry",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Afgoo x Blueberry",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "description": "Gooberry is a potent indica-dominant hybrid, famous for its sedating effects and its role as a parent to the heavy-hitting 9 Pound Hammer. It combines the resinous nature of Afgoo with the sweet flavor of Blueberry. The aroma is a mix of berries, nuts, and earth, while the high is deeply relaxing and often leads to sleep.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Berry", "Nutty", "Earthy", "Sweet"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "jet-fuel-gelato",
        "name": "Jet Fuel Gelato",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Jet Fuel G6 x Gelato #45",
        "floweringType": "Photoperiod",
        "thc": 26,
        "cbd": 1,
        "thcRange": "23-29%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Jet Fuel Gelato is a potent sativa-dominant hybrid known for its uplifting and energizing effects. It has a complex aroma of sweet diesel and floral notes. This strain provides a focused and euphoric high, making it a parent to popular strains like Horchata.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Diesel", "Sweet", "Floral", "Fruity"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "sour-cream",
        "name": "Sour Cream",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Sour Diesel x G13 Haze",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 10.5,
        "floweringTimeRange": "10-11",
        "description": "Sour Cream is a sativa-dominant hybrid with a unique aroma combining sour diesel with creamy, cheesy notes. It provides a powerful, energetic, and focused high that is great for creative tasks and daytime activities. It is a parent of Aspen OG.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Sour", "Diesel", "Cheese", "Creamy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "the-white",
        "name": "The White",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 85% / Sativa 15%",
        "genetics": "Unknown (clone-only, presumed 'Triangle' phenotype)",
        "floweringType": "Photoperiod",
        "thc": 24.5,
        "cbd": 1,
        "thcRange": "20-29%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "The White is a potent, clone-only hybrid of unknown origin, named for the thick layer of white trichomes that covers its buds. Despite its frosty appearance, it has a surprisingly subtle aroma of earth, pine, and diesel. The effect is a powerful, balanced high that starts with cerebral clarity and settles into a comfortable body relaxation. It is a prized parent for breeding due to its high resin production.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Low",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Pine", "Diesel", "Pungent"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    })
];