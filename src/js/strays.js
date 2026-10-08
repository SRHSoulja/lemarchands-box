/**
 * Stray Cucks NFT Collection Integration
 * Contract: 0xc6132bd1b7ee344ba6a53fa203116d168cdc5307
 * Network: Robinhood Chain (Arbitrum L2 • Chain ID 4663)
 * Total Supply: 2,000 STRAY
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.StrayCucks = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const CONTRACT_ADDRESS = '0xc6132bd1b7ee344ba6a53fa203116d168cdc5307';
    const CHAIN_ID = 4663;
    const CHAIN_NAME = 'Robinhood Chain';
    const RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
    const EXPLORER_URL = 'https://explorer.robinhood.com';
    const TOTAL_SUPPLY = 2000;

    const SAMPLES = {
    "527": {
        "id": 527,
        "name": "Stray Cuck #527",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/527.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Royal Hall"
            },
            {
                "trait_type": "Chair",
                "value": "Throne"
            },
            {
                "trait_type": "Upholstery",
                "value": "Crimson"
            },
            {
                "trait_type": "Frame",
                "value": "Brass"
            },
            {
                "trait_type": "Sitter",
                "value": "Cat"
            },
            {
                "trait_type": "Coat",
                "value": "Orange Tabby"
            },
            {
                "trait_type": "Pose",
                "value": "Sitting"
            },
            {
                "trait_type": "Accessory",
                "value": "Crown"
            },
            {
                "trait_type": "1 of 1",
                "value": "The Crowned Stray"
            }
        ],
        "dataUrl": "data:image/png;base64,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"
    },
    "414": {
        "id": 414,
        "name": "Stray Cuck #414",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/414.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Brick Alley"
            },
            {
                "trait_type": "Chair",
                "value": "Toilet"
            },
            {
                "trait_type": "Upholstery",
                "value": "Gold"
            },
            {
                "trait_type": "Sitter",
                "value": "Rat"
            },
            {
                "trait_type": "Pose",
                "value": "Sitting"
            },
            {
                "trait_type": "Accessory",
                "value": "Crown"
            },
            {
                "trait_type": "1 of 1",
                "value": "Porcelain Throne"
            }
        ],
        "dataUrl": "data:image/png;base64,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"
    },
    "1284": {
        "id": 1284,
        "name": "Stray Cuck #1284",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/1284.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Void"
            },
            {
                "trait_type": "Chair",
                "value": "Egg Chair"
            },
            {
                "trait_type": "Upholstery",
                "value": "Gold"
            },
            {
                "trait_type": "Frame",
                "value": "Matte Black"
            },
            {
                "trait_type": "Sitter",
                "value": "Cat"
            },
            {
                "trait_type": "Coat",
                "value": "Black"
            },
            {
                "trait_type": "Pose",
                "value": "Loaf"
            },
            {
                "trait_type": "1 of 1",
                "value": "Void Sitter"
            }
        ],
        "dataUrl": "data:image/png;base64,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"
    },
    "1711": {
        "id": 1711,
        "name": "Stray Cuck #1711",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/1711.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Night Window"
            },
            {
                "trait_type": "Chair",
                "value": "Rocking Chair"
            },
            {
                "trait_type": "Upholstery",
                "value": "Lavender"
            },
            {
                "trait_type": "Frame",
                "value": "Walnut"
            },
            {
                "trait_type": "Sitter",
                "value": "Ghost"
            },
            {
                "trait_type": "Pose",
                "value": "Sitting"
            },
            {
                "trait_type": "Accessory",
                "value": "Blanket"
            },
            {
                "trait_type": "1 of 1",
                "value": "The Ghost Of Chair Past"
            }
        ],
        "dataUrl": "data:image/png;base64,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"
    },
    "4": {
        "id": 4,
        "name": "Stray Cuck #4",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/4.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Cream"
            },
            {
                "trait_type": "Chair",
                "value": "Beanbag"
            },
            {
                "trait_type": "Upholstery",
                "value": "Mustard"
            },
            {
                "trait_type": "Sitter",
                "value": "Cat"
            },
            {
                "trait_type": "Coat",
                "value": "Orange Tabby"
            },
            {
                "trait_type": "Pose",
                "value": "Sitting"
            },
            {
                "trait_type": "Accessory",
                "value": "Floor Lamp"
            },
            {
                "trait_type": "Collar",
                "value": "Lime Collar"
            }
        ],
        "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAIAAADytinCAAAKlklEQVR42u3cX2idZx3A8bw2G4FJwgpDhuxCdqH02Gy4TkOH1kZY8UJrQt121bmbMkZuRDAoxTHpzSaCSB2jF85OxC6UaTaYuEJHb0JJq6annNCLzVGGrmWQkdRBx2Zeb0Vofg/08e3zvufzuf5x3j8559vnpr+qvvbWCADl+ZRXACDQAAg0gEADINAAAg2AQAMg0AACDYBAAwg0AAINgEADCDQAAg0g0AAINIBAAyDQAAg0gEADINAAAg3ArTHqFRSkSvj3st70nijgu1olfFdr78kJGkCgARBoAAQaQKABEGgAgQZAoAEEGgCBBkCgAdrGLo6S2LNBa76r9mw4QQMINAACDYBAAwg0AAININAACDQAAg0g0AAINIBAAyDQAALtFQAINAACDSDQAAg0gEADINAACDSAQAMg0AACDYBAAyDQAAINgEADCDQAAg0g0AAINAACDSDQAAg0QOeNegXALVNV8UxdO0EDINAACDSAQAMg0AACDYBAAyDQAAINgEADCDQATbGLA7h1hnjPhhM0gEADINAAAg2AQAMg0AACDYBAAwg0AAININAACDQAAg0g0AAINIBAAyDQAAg0gEADINAAAg2AQAMg0AACDYBAAwg0AAININAACDQAAg0g0AAINIBAAyDQAAg0gEADINAAAg2AQAMINAACDYBAAwg0AAININAACDQAAg3QEqNeAQyRbbfFM//+2HtyggZAoAEEGgCBBhBoAAQaAIEGEGgABBpAoAEQaIBhZRcHDBN7NpygARBoAIEGQKABEGgAgQZAoAEEGgCBBhBoAAQagK3YxQEUrm7wWpUTNAACDSDQAAg0gEADINAACDSAQAMg0AACDYBAAww3uziA/1G7HydoAAQaQKABEGgAgQZAoAEQaACBBkCgAQQaAIEGGFZ2ccBQqQv7nK6+nxSVEzRAWwk0gEADINAAAg2AQAMINAACDYBAAwg0AAIN0GV2cXRQrzeb5XMGg1e8n1a9nzrTzEiDn4MTNIBAAyDQAAINgEADINAAAg2AQAMINAACDSDQABTFLo6WSdkjMTg2Hc6s98/nuVZh+yi6+37auGdjmPd1VFnejxM0QKEEGkCgARBoAIEGQKABBBoAgQZAoAEEGgCBBugyuziG1MrqWjizNLc9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"
    },
    "23": {
        "id": 23,
        "name": "Stray Cuck #23 (YOU GOT CUCKED)",
        "description": "A stray took this chair before its owner ever sat down. Sent to the wrong wallet during the reserve drop, it is frozen on chain: it cannot be transferred or sold.",
        "image": "https://straycucks.com/gif/23.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Cream"
            },
            {
                "trait_type": "Chair",
                "value": "Folding Chair"
            },
            {
                "trait_type": "Upholstery",
                "value": "Crimson"
            },
            {
                "trait_type": "Frame",
                "value": "Chrome"
            },
            {
                "trait_type": "Sitter",
                "value": "Cat"
            },
            {
                "trait_type": "Coat",
                "value": "Orange Tabby"
            },
            {
                "trait_type": "Pose",
                "value": "Sitting"
            }
        ],
        "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAIAAADytinCAAAKIUlEQVR42u3cwYtdVx3A8Tzfy0DgaRaJaRfSRZAQZvHcxLQdwUVwUXBhh4yLKTMIQSy4qA7SdpFxQmOyUcqUCoIQB+QFIzTx6UZmExhsakyTja92CEPJQrKwgVnEPiikzKR/gfkdzOnNved+PuvDu+edd/nO2cyvs3nz6h4A6udLjgBAoAEQaACBBkCgAQQaAIEGQKABBBoAgQYQaAAEGgCBBhBoAAQaQKABEGgAgQZAoAEQaACBBkCgAQQaAIEGQKABBBoAgQYQaAAEGkCgARBoAAQaQKABEGgAgQbgSeo5Avgir0AJd6Dd3XrtudOJ1zx86Ld1gwYQaAAEGgCBBhBoAAQaQKABEGgABBpAoAEQaIASmcUBX6S6zdlIYc6GGzQAAg0g0AAINIBAAyDQAAg0gEADINAAAg2AQAO0l1kcVekk/C18uOucADdoAIEGQKABBBoAgQYQaAAEGgCBBhBoAAQaQKABeHLM4qiKORsFXm+68ZrdHeeEGzSAQAMg0AACDYBAAyDQAAINgEADCDQAAg2AQAM0h1kc8P8yZwM3aACBBkCgARBoAIEGQKABBBoAgQZAoAEEGgCBBhBoAAQaQKABEGgABBpAoAEQaACBBkCgARBoAIEGQKABytRzBO00O7uU5XNGo1Xn08LzwQ0aQKABEGgABBpAoAEQaACBBkCgARBoAIEGQKABCtXZvHnVKRQmZY7E6MzxcM1kazNcs3hpUuQZVnk+5nXgBg0g0AAINIBAAyDQAAg0gEADINAAAg2AQAMINAC10XMEzZIyZyOX23fuh2uG8/vDNSnzKF47dzbLnn+5vBKuSZmzcWv9eqZT7Gb5Tc3rcIMGQKABEGgAgQZAoAEEGgCBBkCgAQQaAIEGEGgAKmEWR0tNtjbDNYNvvhyumTowDtcM5+NnLSbM0EiRa85Gynd/sP3HeEM3Jl423KABBBoAgQYQaAAEGgCBBhBoAAQaQKABEGgABBqgOcziaKn+kelwzWQrnjXxYDvPfobz/SyfkzJj5Ojh/QnfK/7ut+/cT9hR18uGGzSAQAMg0AACDYBAAyDQAAINgEADCDQAAg2AQAM0h1kcBRqdOR6uubV+PVzzYPJpuGZm7kRlz0pR5X5SnjU8HM8GWbw08dLiBg0g0AAINIBAAyDQAAg0gEADINAAAg2AQAMINAD1YBZHSx09vD9hVbwmZa5FyrP6R57P8r0mW5u1+u5pul5I3KABBBoAgQYQaAAEGgCBBhBoAAQaQKABEGgAgQagHsziaKnbd+6Ha46dHYVrlr/z3XDN+gvT4ZqUGRpN/O7nZqa8bI9p7uRSZc+6fGXVDRoAgQYQaAAEGkCgARBoAAQaQKABEGgAgQZAoAHazSwO/qeLWz/J8jkpczZS5mNU6dbKbLhm4TdfD9cs//ijcM2+7r7WvmMpczZWf7+W5VnX3ns/y36qnNfhBg1QUwININAACDSAQAMg0AACDYBAAyDQAAINgEADlMwsjgLNvhHPHBjO748/6OK/wyXrf/ltlj0fS1jzwvdezvKsXHs++s5yvGZmKlxz/kaZ72GuORtLPzhV2Z5T9jN3Mt5PrnkdbtAANSXQAAINgEADCDQAAg0g0AAINAACDSDQAAg0QMnM4ijQa+fOhmsWl1fCNaMzz4drJgnzKHK5vPDVLJ+Ta8+LlyYJq7peyEe49t779uMGDdA8Ag0g0AAINIBAAyDQAAINgEADINAAAg2AQAOUrLN586pTaJDZ2aUsnzM6czxcc2v9erjmweTTcM3MLy7U6gz//vMfxnueO5HlWZOtzXBNykyP0Wi1Vmc4dzJ+Dz8cL1S2n0/GfwjXfHnwUmXPem5hN1xz+Ur8m7pBA9SUQAMINAACDSDQAAg0gEADINAACDSAQAMg0AAl6zmCdkqZEZEyZ2Oqv69x330weDrL+eRy+tmdcE2uGSwpqpz7kTLX4t2Ne+GaVy8cDNd8OK5uP3v2HMxyPm7QADUl0AACDYBAAwg0AAININAACDQAAg0g0AAINEDJzOKokZR5Cxf/HM8KWHjxpXBN/8h0uGaQsOfx+D+NO+eUPc/MnQjXpMzruH3nfrjm/I1ulu81nO9X9h52Xe3coAEEGgCBBkCgAQQaAIEGEGgABBoAgQYQaAAEGqBMZnE0zPhfH9VqP1P9fY07w8Hg6XBN3eZspFi8NAnXnH52J+GT8uz5k3E8N+bdjXtZnvWPi/Fd869vv+UGDYBAAwg0AAINgEADCDQAAg0g0AAINIBAAyDQAETM4mipXLMmjr3+6zz7eWe5sv30v38uy35SDOf7lf2muWaDjEarWfbz3MmlhFUH83z5C7vVPSvB5St5ztANGqCmBBpAoAEQaACBBkCgAQQaAIEGQKABBBoAgQYoWefN06+Ei3433HBSQG2d+tmr4Zq1N3/lBg2AQAMINAACDYBAAwg0AAININAACDSAQAMg0ABEOtPPDMJFK4d2sjxsvL03XHN+4Vt+FeCJ+PiDD8I1b//zv+GawYHP3KABSibQAAINgEADCDQAAg0g0AAINAACDSDQAAg0QMl6Tdx0yv/LPzVciz9n8VStPifb+dTse6V8Tt008fdq835y2bi7nbBqb2X7cYMGqCmBBhBoAAQaQKABEGgAgQZAoAEQaACBBkCgAUrWcwT1UbcZCDz+71Xq+9PmOS1u0AAINIBAAyDQAAINgEADCDQAAg2AQAMINAACDVC0YmdxmBVAHXjHcIMGEGgABBpAoAEQaAAEGkCgARBoAIEGQKABEGgAgQZAoAEEGgCBBkCgAQQaAIEGEGgABBpAoAEQaAAEGqCBerk+6Oy9brjmxa4Df5Snhmv24/fyexUgpYcrh3bcoAGaSqABBBoAgQYQaAAEGkCgARBoAAQaQKABEGiAkvXa/OU/XjxV5LOauJ82vxul/l7eMTdoAIEGQKABEGgAgQZAoAEEGgCBBhBoAAQaAIEGaKCeI3i0u6O/Vfasr81+O8t+6vY5zqdZ55PrWbhBAwg0AAINgEADCDQAAg0g0AAINIBAAyDQAAg0QANlm8WxcmgnXDPeLvPvgbkEzqek86lyVkmpUnroBg3QYAININAACDSAQAMg0AACDYBAAyDQAAINgEADlKznCGibus2RMNcCN2gAgQZAoAEEGgCBBkCgAQQaAIEGEGgABBpAoAGoDbM4aJ2UuRZVzscwZwM3aACBBkCgAQQaAIEGQKABBBoAgQYQaAAEGkCgAagNszgySJnbkCLXTIZc+yn1fLw/j78f80PcoAEEGgCBBkCgAQQaAIEGEGgABBoAgQYQaAAEGqBQnelnBuGilUM7WR423t4brnnlG18J12zc3fbLAU9ESscGBz5zgwYomUADCDQAAg0g0AAINIBAAyDQAAg0gEADINAAJetc+9Nb4aIf/XTNSQG4QQMg0AACDYBAAwg0AAININAACDQAAg0g0AAINEDpPgfPA+TaxwrtFAAAAABJRU5ErkJggg=="
    },
    "50": {
        "id": 50,
        "name": "Stray Cuck #50",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/50-pumpkin.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Mint"
            },
            {
                "trait_type": "Chair",
                "value": "Rocking Chair"
            },
            {
                "trait_type": "Upholstery",
                "value": "Neon Lime"
            },
            {
                "trait_type": "Frame",
                "value": "Walnut"
            },
            {
                "trait_type": "Sitter",
                "value": "Empty"
            },
            {
                "trait_type": "Accessory",
                "value": "Slippers"
            }
        ],
        "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAIAAADytinCAAAIFElEQVR42u3csWucZRzA8bzhdSgWjnM8johTehIOBKmOuoU6hZS6ddN/IAQcxDi4hYxdOlisIKSIQSghoNhZ6HRJe5ep9JCb5CTg0UG48x8wfR7Jc++9772fz/zjvcvzXr8+i7/sbPLHCgDls+oIAAQaAIEGEGgABBpAoAEQaAAEGkCgARBoAIEGQKABEGgAgQZAoAEEGgCBBhBoAAQaAIEGEGgABBpAoAEQaAAEGkCgARBoAIEGQKABBBoAgQZAoAEEGgCBBhBoAAQaAIEGEGgABBpAoAEQaACBBkCgARBoAIEGQKABBBqAxcsdAfP25moWnJlMZw4K3KABBBoAgQYQaAAEGkCgARBoAAQaQKABEGgAgQZg0eziYO7s2Xi9a1l4V8mrmTN0gwZAoAEQaACBBkCgAQQaAIEGQKABBBoAgQYQaAAKYBcHLJg9G7hBAwg0AAININAACDQAAg0g0AAINIBAAyDQAAINgEADINAAAg2AQAMINAACDYBAAwg0AAININAACDSAQANQMrkjqKfrq1lw5u/pzEGBGzQAAg0g0AAINIBAAyDQAAINgEADINAAAg2AQAPUiV0cNWXPBrhBAyDQAAINgEADCDQAAg2AQAMINAACDSDQAAg0AAININAACDSAQAMg0AACDYBAAyDQAAINgEADCDQAAg2AQAMINAACDSDQAAg0AAININAACDSAQAMg0AACDYBAAyDQAAINgEADCDQAAg2AQAMINAACDSDQAAg0gEADINAARMgdAWVwp3PLIRTgUf/YIbhBAyDQAAINgEADINAAAg2AQAMINAACDSDQAAg0AJezi4O5i9mzsbfddlBX1DsfJnkX9nW4QQMg0AACDYBAAwg0AAINgEADCDQAAg0g0AAINECN2cVBZcTsmuiPLoIznVYjyXNipPqsdN+56YfkBg2AQAMINAACDYBAAwg0AAININAACDSAQAMg0ABczi4OKiNm18RgHN410WlNkzwnRqrP+vTjdsT5nPqRuEEDINAAAg2AQAMg0AACDYBAAwg0AAINgEADCDQAAg0g0AAINIBAOwIAgQZAoAEEGgCBBhBoAAQaAIEGEGgAUsgdQbVcy7LgzKvZzEGBGzQAAg0g0AAINAACDSDQAAg0gEADINAACDSAQAPw/9nFUTH2bIAbNAACDYBAAwg0AAININAACDQAAg0g0AAINIBAAzA3he7ieCMLz/xj1QSAGzSAQAMg0AACDYBAAwg0AAINgEADCDQAAg0g0AAsRqG7OOzZAHCDBhBoAAQaQKABEGgABBpAoAEQaACBBkCgARBoAIEGQKABBBoAgQYQaAAEGgCBBhBoAAQaQKABEGgABBqg9HJHQFV0Wo2ImWlwpj+6CM5sbTSSfOdUn9U7H/oBuEEDINAACDSAQAMg0AACDYBAAyDQAAINgEADCDQA82cXB5e607lVqu8Ts9diMG5GPKkZ8ZxU3zrNZ+1ttyPO57RU7/1R/9g/IjdoAIEGQKABEGgAgQZAoAEEGgCBBhBoAAQaAIEGqBq7OGoqZt9CzP6HGL3zYXDm8MlpYX972XZEFLnzZGtjGpzprq8leacxf5d9HW7QAAINgEADCDQAAg2AQAMINAACDSDQAAg0gEADUDJ2cXAlMTs0BuNmxJPCMzfe+ivJdy5y90XZznkwDn9Wdz080x9dJHmnuEEDCDQAAg0g0AAINAACDSDQAAg0gEADINAAAg1AydjFQSn8+vJDh3BFo5X7wZm7b3cdlBs0AAININAACDQAAg0g0AAINIBAAyDQAAINgEADcDm7OJi7hy97wZnDxz0HVYDP7kWc829tB+UGDYBAAwg0AAININAACDQAAg0g0AAINIBAAyDQAHWVP/zuB6fAf+qdD4MznVYjOHP0SXimu76W5PvUWaoz/HOluHPWHzdoAIEGQKABBBoAgQZAoAEEGgCBBhBoAAQaQKABKJm889F7TqGGYt77/uZOcGZrYxqcOTqLuQcMEz2nztKcYcw7HYybwZndkwOvxA0aQKABEGgABBpAoAEQaACBBkCgAQQaAIEGQKABqiZ3BCyTZd3/ELMXBTdoAAQaQKABEGgABBpAoAEQaACBBkCgARBoAIEGQKABBBoAgQZAoAEEGgCBBhBoAAQaQKABEGgABBpAoAEQaACBBkCgARBoAIEGQKABBBoAgQYQaAAEGgCBBhBoAJLKUz1of3OnVH/Y7snBUn7nKr4L6inV7zDVvws3aAAEGkCgARBoAAQaQKABEGgAgQZAoAEEGgCBBiBC1C6OmP+n/tm974Mzk6cvCvvDbi7pd46xtTFN8pyjs+r999sekvLY224HZw6fnCZ5p8u6r8MNGkCgARBoAIEGQKABBBoAgQZAoAEEGgCBBhBoAAqXvbvWDQ7F7Kz4/dvj4MwHP32R5ls/7iV5TJHfefL1z8GZmw++Cs7c/ubz4MyPX94PzqTa19EfXQRnOq1GYc+ps7K9i5jnDMbNJL/5d95fd4MGQKABBNoRAAg0AAININAACDSAQAMg0AAINIBAA5BCHjM0efoiyYfF7KOIcdbrF3ZAZfvOMTsHdk8OgjP7mzuJTii8S2EwLvI5dVa2d9FM8lt1gwZAoAEQaACBBkCgAQQaAIEGQKABBBoAgQYQaAAKlD14/ktwKN3eBl7HXgLADRpAoAEQaACBBkCgAQQaAIEGQKABBBoAgQYQaAAWKmoXBwBu0AAINIBAAyDQAAINgEADCDQAAg2AQAMINAACDVAD/wJuvhZaipha8gAAAABJRU5ErkJggg=="
    },
    "58": {
        "id": 58,
        "name": "Stray Cuck #58",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/58.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Night Window"
            },
            {
                "trait_type": "Chair",
                "value": "School Chair"
            },
            {
                "trait_type": "Upholstery",
                "value": "Neon Lime"
            },
            {
                "trait_type": "Frame",
                "value": "Matte Black"
            },
            {
                "trait_type": "Sitter",
                "value": "Pigeon"
            },
            {
                "trait_type": "Pose",
                "value": "Sitting"
            },
            {
                "trait_type": "Accessory",
                "value": "Neon Sign"
            }
        ],
        "dataUrl": "data:image/png;base64,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"
    },
    "6": {
        "id": 6,
        "name": "Stray Cuck #6",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/6.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Starfield"
            },
            {
                "trait_type": "Chair",
                "value": "Throne"
            },
            {
                "trait_type": "Upholstery",
                "value": "Teal"
            },
            {
                "trait_type": "Frame",
                "value": "Matte Black"
            },
            {
                "trait_type": "Sitter",
                "value": "Cat"
            },
            {
                "trait_type": "Coat",
                "value": "Calico"
            },
            {
                "trait_type": "Pose",
                "value": "Sleeping"
            },
            {
                "trait_type": "Accessory",
                "value": "Slippers"
            }
        ],
        "dataUrl": "data:image/png;base64,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"
    },
    "82": {
        "id": 82,
        "name": "Stray Cuck #82",
        "description": "Stray Cucks: 2,000 hand-drawn pixel chairs on Robinhood Chain. Some are empty. Some have been claimed by a stray.",
        "image": "https://straycucks.com/gif/82.gif",
        "attributes": [
            {
                "trait_type": "Background",
                "value": "Diamond Wallpaper"
            },
            {
                "trait_type": "Chair",
                "value": "Gaming Chair"
            },
            {
                "trait_type": "Upholstery",
                "value": "Bubblegum"
            },
            {
                "trait_type": "Frame",
                "value": "White"
            },
            {
                "trait_type": "Sitter",
                "value": "Cat"
            },
            {
                "trait_type": "Coat",
                "value": "Orange Tabby"
            },
            {
                "trait_type": "Pose",
                "value": "Sitting"
            },
            {
                "trait_type": "Accessory",
                "value": "Coffee Mug"
            }
        ],
        "dataUrl": "data:image/png;base64,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"
    }
};

    const imageCache = {};

    // Eagerly pre-instantiate all offline embedded sample images in browser environment
    if (typeof Image !== 'undefined') {
        try {
            Object.keys(SAMPLES).forEach(id => {
                const s = SAMPLES[id];
                if (s && s.dataUrl) {
                    const img = new Image();
                    // Data URIs must NEVER have crossOrigin set (violates CORS policy in Chromium/WebKit)
                    img.onload = () => {
                        imageCache[String(id)] = img;
                        imageCache[s.name] = img;
                        s.imageElement = img;
                    };
                    img.src = s.dataUrl;
                    if (img.complete && img.naturalWidth > 0) {
                        imageCache[String(id)] = img;
                        imageCache[s.name] = img;
                        s.imageElement = img;
                    }
                }
            });
        } catch (e) {}
    }

    function getSample(tokenId) {
        return SAMPLES[String(tokenId)] || null;
    }

    async function fetchStray(tokenId) {
        const id = parseInt(tokenId);
        if (isNaN(id) || id < 1 || id > TOTAL_SUPPLY) {
            throw new Error('Invalid token ID (Must be 1 - 2000)');
        }

        const sample = getSample(id);
        if (sample) return sample;

        try {
            const url = 'https://stray-cucks.thearsondragon.workers.dev/meta/' + id;
            const res = await fetch(url, { mode: 'cors' });
            if (res.ok) {
                const data = await res.json();
                return {
                    id: id,
                    name: data.name || ('Stray Cuck #' + id),
                    description: data.description || '',
                    image: data.image || ('https://straycucks.com/gif/' + id + '.gif'),
                    attributes: data.attributes || [],
                    dataUrl: null
                };
            }
        } catch (e) {
            // Network fallback
        }

        return {
            id: id,
            name: 'Stray Cuck #' + id,
            description: 'Stray Cuck #' + id + ' on Robinhood Chain',
            image: 'https://straycucks.com/gif/' + id + '.gif',
            attributes: [],
            dataUrl: null
        };
    }

    function preloadStrayImage(relic, callback) {
        if (!relic) {
            if (callback) callback(null);
            return null;
        }

        const key = String(relic.id || relic.name);
        if (imageCache[key] && imageCache[key].complete && imageCache[key].naturalWidth > 0) {
            if (callback) callback(imageCache[key]);
            return imageCache[key];
        }

        // If sample exists in SAMPLES with imageElement ready, use it immediately
        if (relic.id && SAMPLES[String(relic.id)]) {
            const s = SAMPLES[String(relic.id)];
            if (s.imageElement && s.imageElement.complete && s.imageElement.naturalWidth > 0) {
                imageCache[key] = s.imageElement;
                if (callback) callback(s.imageElement);
                return s.imageElement;
            }
            if (!relic.dataUrl && s.dataUrl) {
                relic.dataUrl = s.dataUrl;
            }
        }

        const src = relic.dataUrl || relic.image || (relic.id ? ('https://straycucks.com/gif/' + relic.id + '.gif') : null);
        if (!src) {
            if (callback) callback(null);
            return null;
        }

        const img = new Image();
        // NEVER set crossOrigin on data: URIs (CORS is HTTP/HTTPS only)
        if (!src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }

        img.onload = () => {
            imageCache[key] = img;
            if (callback) callback(img);
        };
        img.onerror = () => {
            // If crossOrigin failed on remote HTTP, retry without crossOrigin
            if (!src.startsWith('data:') && img.crossOrigin) {
                const fallbackImg = new Image();
                fallbackImg.onload = () => {
                    imageCache[key] = fallbackImg;
                    if (callback) callback(fallbackImg);
                };
                fallbackImg.onerror = () => {
                    if (callback) callback(null);
                };
                fallbackImg.src = src;
                return;
            }
            if (callback) callback(null);
        };
        img.src = src;

        if (img.complete && img.naturalWidth > 0) {
            imageCache[key] = img;
            if (callback) callback(img);
        }
        return img;
    }

    return {
        CONTRACT_ADDRESS,
        CHAIN_ID,
        CHAIN_NAME,
        RPC_URL,
        EXPLORER_URL,
        TOTAL_SUPPLY,
        SAMPLES,
        getSample,
        fetchStray,
        preloadStrayImage
    };
}));
