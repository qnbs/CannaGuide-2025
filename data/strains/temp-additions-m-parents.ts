import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "starfighter", "name": "Starfighter", "type": StrainType.Hybrid, "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Alien Tahoe OG x Lemon Alien Dawg", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "alien-tahoe-og", "name": "Alien Tahoe OG", "type": StrainType.Hybrid, "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Tahoe OG Kush x Alien Kush", "floweringType": "Photoperiod", "thc": 21, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "lemon-alien-dawg", "name": "Lemon Alien Dawg", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Alien Dawg x Lemon Kush", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "lemon-kush", "name": "Lemon Kush", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Master Kush x Lemon Joy", "floweringType": "Photoperiod", "thc": 21, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "lemon-joy", "name": "Lemon Joy", "type": StrainType.Hybrid, "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Lemon Pebbles x Lemon Cooler", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "lemon-pebbles", "name": "Lemon Pebbles", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Fruity Pebbles OG x Lemon Kush", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "malawian-landrace", "name": "Malawian Landrace", "type": StrainType.Sativa, "typeDetails": "Sativa 100%",
        "genetics": "Landrace", "floweringType": "Photoperiod", "thc": 18, "cbd": 1, "floweringTime": 11
    }),
    createStrainObject({
        "id": "forum-cut-cookies", "name": "Forum Cut Cookies", "type": StrainType.Hybrid, "typeDetails": "Indica 75% / Sativa 25%",
        "genetics": "GSC", "floweringType": "Photoperiod", "thc": 26, "cbd": 1, "floweringTime": 9.5
    }),
    createStrainObject({
        "id": "mandarin-sunset", "name": "Mandarin Sunset", "type": StrainType.Hybrid, "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Herijuana x Orange Skunk", "floweringType": "Photoperiod", "thc": 24, "cbd": 1, "floweringTime": 8.5
    }),
    createStrainObject({
        "id": "orange-skunk", "name": "Orange Skunk", "type": StrainType.Hybrid, "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Skunk #1", "floweringType": "Photoperiod", "thc": 19, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "california-black-rose", "name": "California Black Rose", "type": StrainType.Indica, "typeDetails": "Indica 100%",
        "genetics": "Roze x OG Eddy", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 7.5
    }),
    createStrainObject({
        "id": "roze", "name": "Roze", "type": StrainType.Indica, "typeDetails": "Indica 100%", "genetics": "Unknown", "floweringType": "Photoperiod", "thc": 18, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "og-eddy", "name": "OG Eddy", "type": StrainType.Hybrid, "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "OG Kush x Grape Ape", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 8.5
    }),
    createStrainObject({
        "id": "mango", "name": "Mango", "type": StrainType.Hybrid, "typeDetails": "Indica 65% / Sativa 35%",
        "genetics": "KC 33 x Afghani", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "kc-33", "name": "KC 33", "type": StrainType.Hybrid, "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Thai x Brazilian x Afghani", "floweringType": "Photoperiod", "thc": 18, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "martian-mean-green", "name": "Martian Mean Green", "type": StrainType.Hybrid, "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Sharksbreath x G13 Haze", "floweringType": "Photoperiod", "thc": 23, "cbd": 1, "floweringTime": 9.5
    }),
    createStrainObject({
        "id": "sharksbreath", "name": "Sharksbreath", "type": StrainType.Hybrid, "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Great White Shark x Lamb's Bread", "floweringType": "Photoperiod", "thc": 21, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "the-original", "name": "The Original", "type": StrainType.Hybrid, "typeDetails": "Indica 85% / Sativa 15%",
        "genetics": "OG Kush", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 8.5
    }),
    createStrainObject({
        "id": "afghan-landrace", "name": "Afghan Landrace", "type": StrainType.Indica, "typeDetails": "Indica 100%", "genetics": "Landrace", "floweringType": "Photoperiod", "thc": 18, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "mendo-montage", "name": "Mendo Montage", "type": StrainType.Hybrid, "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Mendocino Purps x Crystal Locomotive F1", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 8.5
    }),
    createStrainObject({
        "id": "crystal-locomotive-f1", "name": "Crystal Locomotive F1", "type": StrainType.Hybrid, "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Trainwreck x White Widow", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 9.5
    }),
    createStrainObject({
        "id": "meatloaf", "name": "Meatloaf", "type": StrainType.Hybrid, "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Mendo Breath x Unknown", "floweringType": "Photoperiod", "thc": 25, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "north-american-indica", "name": "North American Indica", "type": StrainType.Indica, "typeDetails": "Indica 100%", "genetics": "Landrace", "floweringType": "Photoperiod", "thc": 18, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "sweet-irish-kush", "name": "Sweet Irish Kush", "type": StrainType.Hybrid, "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Sweet Skunk x Kish", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "kish", "name": "Kish", "type": StrainType.Hybrid, "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "DJ Short Blueberry x Afghani", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 8.5
    }),
    createStrainObject({
        "id": "sweet-skunk", "name": "Sweet Skunk", "type": StrainType.Hybrid, "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Skunk #1 x an unknown sweet Indica", "floweringType": "Photoperiod", "thc": 19, "cbd": 1, "floweringTime": 7.5
    }),
    createStrainObject({
        "id": "clementine", "name": "Clementine", "type": StrainType.Hybrid, "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Tangie x Lemon Skunk", "floweringType": "Photoperiod", "thc": 23, "cbd": 1, "floweringTime": 8.5
    }),
    createStrainObject({
        "id": "green-ribbon", "name": "Green Ribbon", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Green Crack x Trainwreck", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "maple-leaf-indica", "name": "Maple Leaf Indica", "type": StrainType.Indica, "typeDetails": "Indica 100%",
        "genetics": "Afghani Landrace", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 7.5
    })
];