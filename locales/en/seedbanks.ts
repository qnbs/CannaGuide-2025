// This file consolidates all seed bank data to resolve a module import error.
// Previously, this file attempted to import from non-existent 'eu' and 'us-ca' sub-files.
// To fix this, the content for those categories has been defined directly within this file.

const seedbanks_eu = {
    sensiSeeds: {
        title: "1. Sensi Seeds",
        profile: {
            title: "Company Profile and Reputation",
            content: "Founded in 1985, Sensi Seeds is one of the oldest and most respected seed banks in the world. Based in Amsterdam, they are responsible for preserving and breeding many classic strains like Jack Herer and Northern Lights. Their reputation is legendary."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Shipping",
                points: ["Ships worldwide with discreet packaging.", "Shipping costs vary by location."]
            },
            payment: {
                title: "Payment Methods",
                methods: ["Credit Card", "Bank Transfer", "Cryptocurrencies"]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "An absolutely safe choice for classic, stable, and proven genetics. Their influence on modern cannabis breeding is undeniable. Ideal for growers looking for the foundations of cannabis genetics."
        }
    },
    dutchPassion: {
        title: "2. Dutch Passion",
        profile: {
            title: "Company Profile and Reputation",
            content: "Founded in 1987, Dutch Passion is a pioneer in the development of feminized seeds. They are known for their innovations and a wide range of high-quality feminized and autoflowering strains. Their strains like Blueberry and Mazar are world-famous."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Shipping",
                points: ["Offers worldwide, discreet shipping.", "Various shipping options available."]
            },
            payment: {
                title: "Payment Methods",
                methods: ["Credit Card", "Bank Transfer", "Cryptocurrencies"]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "An excellent source for a wide range of high-quality feminized and autoflowering strains. Their long history and focus on innovation make them a trustworthy choice for growers of all experience levels."
        }
    },
    barneysFarm: {
        title: "3. Barney's Farm",
        profile: {
            title: "Company Profile and Reputation",
            content: "Barney's Farm is a multiple award-winning seed bank from Amsterdam, known for its potent and flavorful hybrids. They have won numerous Cannabis Cups and are known for strains like Critical Kush and Pineapple Chunk."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Shipping",
                points: ["Worldwide shipping with various discreet options."]
            },
            payment: {
                title: "Payment Methods",
                methods: ["Credit Card", "Cryptocurrencies", "Bank Transfer"]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "A top choice for growers looking for potent, high-yielding, and award-winning strains. Their genetics are consistently of high quality and very popular among connoisseurs."
        }
    }
};

const seedbanks_us_ca = {
    dnaGenetics: {
        title: "4. DNA Genetics",
        profile: {
            title: "Company Profile and Reputation",
            content: "DNA Genetics was founded in Amsterdam but has strong California roots. They are famous for developing blockbuster strains like LA Confidential and Tangie. Their genetics have won countless awards and are known worldwide."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Shipping",
                points: ["Sales are conducted through authorized retailers worldwide, both online and in physical stores."]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "A top-tier source for connoisseurs looking for potent, flavorful, and award-winning strains. Availability is good due to their wide network of retailers."
        }
    },
    cropKingSeeds: {
        title: "5. Crop King Seeds",
        profile: {
            title: "Company Profile and Reputation",
            content: "Crop King Seeds is a Canadian seed bank known for its wide selection and marketing. They offer a broad range of feminized, autoflowering, and CBD-rich strains aimed at growers of all experience levels."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Shipping",
                points: ["Offers worldwide shipping with a delivery guarantee."]
            },
            payment: {
                title: "Payment Methods",
                methods: ["Credit Card", "Bitcoin", "Interac (Canada)"]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "A good choice for beginners and growers looking for a wide selection and a delivery guarantee. While some experienced growers criticize the genetic stability, they are an accessible option for getting started."
        }
    }
};

export const seedbanks = {
    ...seedbanks_eu,
    ...seedbanks_us_ca,
    grandifloraGenetics: {
        title: "34. Grandiflora Genetics",
        profile: {
            title: "Company Profile and Reputation",
            content: "Grandiflora Genetics is a highly respected breeder from Oakland, California, known for developing unique, potent, and extremely flavorful strains. They have built a reputation in the cannabis community for exotic terpene profiles and top-tier genetics. Their business strategy focuses on limited, exclusive 'drops' rather than mass-market sales."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Sales are conducted exclusively through a network of authorized dealers and seed banks. There is no direct-to-public sale."]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "A premium choice for connoisseurs seeking unique and potent genetics. Acquisition requires monitoring their social media channels and authorized vendors for 'drop' announcements. The quality is consistently high, justifying the premium price point."
        }
    },
    beanPatchSeeds: {
        title: "35. Bean Patch Seeds",
        profile: {
            title: "Company Profile and Reputation",
            content: "Bean Patch Seeds is a smaller, boutique breeder known for working with rare and heirloom genetics. They focus on preserving and crossing unique lines, often in regular seed form, catering to experienced growers and pheno-hunters. Their reputation in niche communities is positive, valued for genetic diversity."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Sales are primarily through specialized online seed banks that carry boutique breeders. Direct sales are limited or non-existent."]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "An excellent source for growers looking for rare and non-hybridized genetics. The focus on regular seeds makes them ideal for breeding projects. Sourcing requires research into vendors specializing in boutique breeders."
        }
    },
    irvineSeedCompany: {
        title: "36. Irvine Seed Company",
        profile: {
            title: "Company Profile and Reputation",
            content: "Irvine Seed Company (ISC) is a California-based breeder known for working with elite clones and creating potent, OG-dominant hybrids. They have established a reputation for strong, gassy, and complex terpene profiles, targeting the connoisseur market."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Similar to other premium breeders, sales are often through limited drops at select retailers. Check their social media for announcements."]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "A top choice for lovers of OG Kush and gassy strains. The quality and potency are high, but availability can be limited. Ideal for growers seeking elite California genetics."
        }
    },
    exoticGenetix: {
        title: "37. Exotic Genetix",
        profile: {
            title: "Company Profile and Reputation",
            content: "Exotic Genetix is one of the most well-known and decorated seed banks in recent years, founded by Mike. They are famous for creating blockbuster strains like Grease Monkey and Cookies and Cream. Their reputation for potency, flavor, and visual appeal is top-tier."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Exotic Genetix sells seeds through a network of authorized online retailers in the US and internationally. There is no direct-to-consumer sales via their main website."]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "One of the best sources for modern, dessert-like, and potent hybrids. Their genetics are consistently high-quality and have proven themselves in competitions. A safe bet for growers looking for top-shelf, hyped genetics."
        }
    },
    etherealGenetix: {
        title: "38. Ethereal Genetix",
        profile: {
            title: "Company Profile and Reputation",
            content: "Ethereal Genetix is an up-and-coming breeder focusing on developing unique crosses with an emphasis on terpene profiles and visual appeal. They are active in online grower communities and are building a reputation for interesting and quality genetics."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Sales are typically through a selection of online seed banks that feature rising American breeders. Direct sales are rare."]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "An interesting choice for growers who enjoy trying new and exciting genetics from an emerging breeder. Quality appears to be high, but the brand is less established than others on this list."
        }
    },
    khalifaGenetics: {
        title: "39. Khalifa Genetics",
        profile: {
            title: "Company Profile and Reputation",
            content: "Khalifa Genetics is a breeder specializing in the preservation and breeding of rare and exotic landraces, as well as unique hybrids. They emphasize genetic diversity and often offer strains that are hard to find elsewhere, particularly from the Middle East and Asia."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Sells through their own website and select European distributors. They offer worldwide, discreet shipping."]
            },
            payment: {
                title: "Payment Methods",
                methods: ["Cryptocurrencies (Bitcoin, etc.)", "Bank Transfer"]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "An excellent source for connoisseurs and breeders interested in authentic landraces and unique crosses. Their focus on rare genetics sets them apart from many commercial seed banks. A top choice for genetic diversity."
        }
    },
    umamiSeedCo: {
        title: "40. Umami Seed Co",
        profile: {
            title: "Company Profile and Reputation",
            content: "Umami Seed Co is a California-based breeder known for their work with elite clones and creating unique, flavor-forward hybrids. They focus on complex terpene profiles and have cultivated a reputation for quality and exclusivity."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Sales are conducted through limited drops on their own website and at select premium retailers."]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "A premium brand for growers seeking the latest in California genetics. Quality is high, but availability is limited and prices are often in the upper tier. Requires monitoring for drop announcements."
        }
    },
    irieGenetics: {
        title: "41. Irie Genetics",
        profile: {
            title: "Company Profile and Reputation",
            content: "Founded by breeder Rasta Jeff, Irie Genetics focuses on creating easy-to-grow, high-yielding, and potent strains. They have a strong community presence and are known for their detailed grow guides and customer support. Their 'Arcata Trainwreck' is highly regarded."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Sells through their own website and authorized US retailers. They offer discreet shipping within the US."]
            },
            payment: {
                title: "Payment Methods",
                methods: ["Credit Cards", "Other online payment options"]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "An excellent choice for growers of all levels seeking reliable genetics with good support. Their customer-focused approach and community engagement make them a trustworthy source."
        }
    },
    bloomSeedCompany: {
        title: "42. Bloom Seed Company",
        profile: {
            title: "Company Profile and Reputation",
            content: "Bloom Seed Co is a highly respected breeder collective known for creating some of the most sought-after and flavorful strains on the market. They often collaborate with other top breeders and are known for their limited, high-quality production."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Sales are exclusively through a small network of exclusive retailers. Drops are highly sought after and sell out quickly."]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "An absolute top-tier source for connoisseurs looking for the best of the best. The genetics are exceptional but difficult to obtain and expensive. Acquisition requires planning and monitoring retailer announcements."
        }
    },
    brothersGrimmSeeds: {
        title: "43. Brothers Grimm Seeds",
        profile: {
            title: "Company Profile and Reputation",
            content: "Brothers Grimm Seeds is a legendary seed bank originally founded in the 1990s, responsible for creating the iconic Cinderella 99 strain. After a hiatus, they returned to the market, offering both their classic lines and new crosses. They have a reputation for stable, potent, and high-yielding sativa-dominant strains."
        },
        policies: {
            title: "Operational Policies",
            shipping: {
                title: "Distribution Model",
                points: ["Sells through their official website and authorized retailers. They ship within the US and internationally to many countries."]
            },
            payment: {
                title: "Payment Methods",
                methods: ["Credit Cards", "Cryptocurrencies", "Money Orders"]
            }
        },
        assessment: {
            title: "Analyst's Assessment",
            content: "A heritage brand with an invaluable genetic legacy. An excellent choice for growers looking for classic, proven sativa hybrids with high potency and reliability. Direct sales make them a secure and accessible source."
        }
    },
    conclusions: {
        title: "Summary Conclusions and Strategic Recommendations",
        content: "The seed market is divided into two main categories: breeders who create genetics and resellers (seed banks) who distribute them. The analysis above highlights that the choice of provider depends on the cultivator's strategic goals.",
        categories: {
            resellers: {
                title: "Resellers/Distributors",
                content: "Large resellers like Herbies or Seedsman offer a wide selection, fast logistics, and often good customer service, making them a low-risk choice for accessing many different genetics. However, their quality depends on the quality of their breeder partners."
            },
            breeders: {
                title: "Breeders",
                content: "Buying directly from a reputable breeder like Brothers Grimm or Khalifa Genetics (where possible) guarantees genetic authenticity. However, many elite breeders (e.g., Grandiflora, Exotic Genetix, Bloom) distribute exclusively through a network of dealers. In these cases, the reliability of the dealer must be evaluated."
            },
            boutiques: {
                title: "Boutique Breeders",
                content: "Smaller breeders like Bean Patch or Ethereal offer unique and rare genetics often not found in the mainstream. This is ideal for experimental growers but carries a higher risk in terms of stability and consistency compared to established brands."
            }
        },
        summary: "For maximum security and quality, it is recommended to either buy directly from a reputable breeder with their own distribution structure or to choose a large, well-reviewed distributor that carries the genetics of the desired breeder."
    }
};