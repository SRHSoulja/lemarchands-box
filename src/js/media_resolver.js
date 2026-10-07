/**
 * RelicMediaResolver - Universal Web3 NFT Media & Metadata Resolver
 * 
 * Supports:
 * - On-Chain SVG (raw XML strings and data:image/svg+xml)
 * - On-Chain Base64 Data URIs (data:image/png;base64, data:application/json;base64)
 * - IPFS (ipfs:// URIs with multi-gateway failover: ipfs.io, cloudflare, dweb.link, pinata)
 * - Arweave (ar:// URIs and arweave.net gateway)
 * - Self-Hosted / Web2 HTTPS (Cloudflare, AWS S3, custom CDN, IPFS gateways)
 * - CORS failover handling
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RelicMediaResolver = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const IPFS_GATEWAYS = [
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/',
        'https://gateway.pinata.cloud/ipfs/'
    ];

    const ARWEAVE_GATEWAYS = [
        'https://arweave.net/',
        'https://arweave.dev/'
    ];

    const CORS_PROXIES = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url='
    ];

    const imageCache = {};

    /**
     * Detects media URI scheme
     */
    function detectType(uri) {
        if (!uri || typeof uri !== 'string') return 'unknown';
        const trimmed = uri.trim();
        if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) return 'raw-svg';
        if (trimmed.startsWith('data:image/svg+xml')) return 'onchain-svg-data';
        if (trimmed.startsWith('data:image/')) return 'onchain-image-data';
        if (trimmed.startsWith('data:application/json')) return 'onchain-json-data';
        if (trimmed.startsWith('ipfs://')) return 'ipfs';
        if (trimmed.includes('/ipfs/Qm') || trimmed.includes('/ipfs/bafy')) return 'ipfs-http';
        if (trimmed.startsWith('ar://')) return 'arweave';
        if (trimmed.includes('arweave.net/')) return 'arweave-http';
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return 'http';
        return 'unknown';
    }

    /**
     * Resolves an IPFS URI into a list of accessible HTTP gateway mirrors
     */
    function getIPFSMirrors(uri) {
        if (!uri) return [];
        let cidPath = uri;
        if (cidPath.startsWith('ipfs://ipfs/')) {
            cidPath = cidPath.replace('ipfs://ipfs/', '');
        } else if (cidPath.startsWith('ipfs://')) {
            cidPath = cidPath.replace('ipfs://', '');
        } else if (cidPath.includes('/ipfs/')) {
            cidPath = cidPath.substring(cidPath.indexOf('/ipfs/') + 6);
        }
        cidPath = cidPath.replace(/^\/+/, '');
        return IPFS_GATEWAYS.map(gw => `${gw}${cidPath}`);
    }

    /**
     * Resolves an Arweave URI into a list of accessible HTTP gateway mirrors
     */
    function getArweaveMirrors(uri) {
        if (!uri) return [];
        let txId = uri;
        if (txId.startsWith('ar://')) {
            txId = txId.replace('ar://', '');
        } else if (txId.includes('arweave.net/')) {
            txId = txId.substring(txId.indexOf('arweave.net/') + 12);
        }
        txId = txId.replace(/^\/+/, '');
        return ARWEAVE_GATEWAYS.map(gw => `${gw}${txId}`);
    }

    /**
     * Normalizes any URI (IPFS, Arweave, On-Chain, HTTP) to an immediately usable URL or data URI
     */
    function resolveMediaURI(uri) {
        if (!uri || typeof uri !== 'string') return '';
        const trimmed = uri.trim();
        const type = detectType(trimmed);

        if (type === 'raw-svg') {
            return 'data:image/svg+xml;utf8,' + encodeURIComponent(trimmed);
        }
        if (type === 'onchain-svg-data' || type === 'onchain-image-data') {
            return trimmed;
        }
        if (type === 'ipfs') {
            return getIPFSMirrors(trimmed)[0] || trimmed;
        }
        if (type === 'arweave') {
            return getArweaveMirrors(trimmed)[0] || trimmed;
        }
        return trimmed;
    }

    /**
     * Decodes fully on-chain JSON metadata or fetches from IPFS/Arweave/HTTP
     */
    async function resolveMetadata(tokenURI) {
        if (!tokenURI) throw new Error('Empty tokenURI');
        const trimmed = tokenURI.trim();
        const type = detectType(trimmed);

        // 1. Fully On-Chain Base64 JSON (e.g. Uniswap v3, Terraforms, Mathcastles)
        if (type === 'onchain-json-data') {
            try {
                if (trimmed.includes(';base64,')) {
                    const b64 = trimmed.split(';base64,')[1];
                    const decoded = (typeof atob !== 'undefined') ? atob(b64) : Buffer.from(b64, 'base64').toString('utf-8');
                    return JSON.parse(decoded);
                } else if (trimmed.includes(',')) {
                    const str = decodeURIComponent(trimmed.split(',')[1]);
                    return JSON.parse(str);
                }
            } catch (e) {
                console.warn('[RelicMediaResolver] Failed to parse on-chain JSON:', e);
            }
        }

        // 2. IPFS Multi-Gateway Fetch with Failover
        if (type === 'ipfs' || type === 'ipfs-http') {
            const mirrors = getIPFSMirrors(trimmed);
            for (const url of mirrors) {
                try {
                    const res = await fetch(url, { mode: 'cors' });
                    if (res.ok) return await res.json();
                } catch (e) {
                    continue; // Try next gateway
                }
            }
            throw new Error('All IPFS gateways failed to resolve metadata');
        }

        // 3. Arweave Fetch with Failover
        if (type === 'arweave' || type === 'arweave-http') {
            const mirrors = getArweaveMirrors(trimmed);
            for (const url of mirrors) {
                try {
                    const res = await fetch(url, { mode: 'cors' });
                    if (res.ok) return await res.json();
                } catch (e) {
                    continue;
                }
            }
            throw new Error('All Arweave gateways failed to resolve metadata');
        }

        // 4. Standard HTTPS
        try {
            const res = await fetch(trimmed, { mode: 'cors' });
            if (res.ok) return await res.json();
        } catch (e) {
            // Attempt CORS proxy for stubborn Web2 endpoints
            for (const proxy of CORS_PROXIES) {
                try {
                    const res = await fetch(`${proxy}${encodeURIComponent(trimmed)}`);
                    if (res.ok) return await res.json();
                } catch (pe) {
                    continue;
                }
            }
            throw e;
        }
    }

    /**
     * Loads an NFT image from any source (on-chain data URI, raw SVG, IPFS, Arweave, HTTPS)
     * Handles caching, gateway rotation, and CORS fallback
     */
    function loadNFTImage(imageSource, onLoaded, onError) {
        if (!imageSource) {
            if (onError) onError(new Error('Empty image source'));
            return null;
        }

        const normalizedSrc = resolveMediaURI(imageSource);
        if (imageCache[normalizedSrc] && imageCache[normalizedSrc].complete) {
            if (onLoaded) onLoaded(imageCache[normalizedSrc]);
            return imageCache[normalizedSrc];
        }

        const type = detectType(imageSource);
        const img = new Image();

        // Data URIs do not require CORS credentials
        if (type !== 'onchain-image-data' && type !== 'onchain-svg-data' && type !== 'raw-svg') {
            img.crossOrigin = 'anonymous';
        }

        let ipfsMirrors = (type === 'ipfs' || type === 'ipfs-http') ? getIPFSMirrors(imageSource) : [];
        let mirrorIdx = 0;

        img.onload = () => {
            imageCache[normalizedSrc] = img;
            if (onLoaded) onLoaded(img);
        };

        img.onerror = (err) => {
            // If IPFS failed on first gateway, try next mirror
            if (ipfsMirrors.length > 0 && mirrorIdx + 1 < ipfsMirrors.length) {
                mirrorIdx++;
                img.src = ipfsMirrors[mirrorIdx];
                return;
            }

            // If remote HTTP failed due to CORS or host restrictions, attempt CORS proxy
            if (type === 'http' && !img.src.includes('corsproxy.io')) {
                img.src = `${CORS_PROXIES[0]}${encodeURIComponent(normalizedSrc)}`;
                return;
            }

            console.warn('[RelicMediaResolver] Could not load NFT image from:', imageSource);
            if (onError) onError(err);
        };

        img.src = normalizedSrc;
        return img;
    }

    return {
        detectType,
        getIPFSMirrors,
        getArweaveMirrors,
        resolveMediaURI,
        resolveMetadata,
        loadNFTImage,
        IPFS_GATEWAYS,
        ARWEAVE_GATEWAYS
    };
}));
