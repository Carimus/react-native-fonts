import { Platform } from 'react-native';

/**
 * @typedef {{
 *      name?: string,
 *      fileName?: string,
 *      postScriptName?: string,
 *      weight?: number,
 *      style?: string
 * }} FontFileDefinition
 * @see fonts
 * @see https://fontdrop.info/ which can help identify characteristics about a font file
 *
 * A FontFileDefinition is an object that describes an available fontFile and when it should be applied. A font file
 * should already be included in the react-native app using the "assets" configuration in `react-native.config.js`.
 * A font file typically contains a combination of a specific weight and style. A FontFileDefinition can have any of the
 * following properties (all of which can be surmised using FontDrop.info very easily):
 *
 * -   `name`: string; optional as long as postScriptName and fileName are both specified; If postScriptName and
 *     fileName are the same, use name as a shortcut to define both.
 * -   `postScriptName`: string; optional if name is specified; the postScriptName of the font in the font file. Used
 *     on iOS.
 * -   `fileName`: string; optional if name is specified; the name of the font file without the extension. Used on
 *     android.
 * -   `weight`: integer; optional; the usWeightClass (i.e. the weight you would indicate in the browser from 100 to
 *      900); defaults to 400
 * -   `style`: string; optional; either 'regular' or 'italic'; defaults to 'regular'
 */

/**
 * @typedef {{
 *     fonts: Map<string, FontFileDefinition[]>,
 *     cache: Map<string, FontFileDefinition>,
 *     findInCache: function(family: string, style: string, weight: number): FontFileDefinition|null,
 *     lookup: function(family: string, options: { weight?: number, style?: string, ignoreCache?: boolean }): FontFileDefinition|null,
 *     createFontStyles: function(family: string, options: { weight?: number, style?: string }, lookupOptions: { ignoreCache?: boolean }): {
 *         fontFamily: string,
 *         fontWeight?: string,
 *         fontStyle?: string,
 *     },
 * }} FontRegistry
 *
 * A FontRegistry is an object with a couple exposed methods:
 *
 * -   `findInCache(family: string, style: string, weight: number)`: Find an exact match in the cache for a family +
 *     style + weight combo.
 * -   `lookup(family: string, { style:string = 'normal', weight:number = 400, ignoreCache:boolean = false })`: Finds
 *     a fuzzy match for the given family using style and weight preferences. Always returns at least one match if
 *     there's at least on font defined for the given family. Falls back to normal style and 400 weight or whatever's
 *     available if those are not.
 * -   `createFontStyles((family: string, { style:string = 'normal', weight:number = 400 }, { ignoreCache:boolean = false })`:
 *     Generates an object of platform-specific styles based on the given family + style + weight parameters. Uses
 *     `lookup` to find a match. Any additional keys provided to the second argument will be merged into the final
 *     styles object.
 */

/**
 * The separator used when generating cache keys for the font cache.
 *
 * @constant
 *
 * @type {string}
 */
export const FONT_CACHE_KEY_SEPARATOR = '~~~';

/**
 * Generate a key to lookup or store in the font cache.
 *
 * @see fontCache
 * @see FONT_CACHE_KEY_SEPARATOR
 *
 * @param {string} family
 * @param {string} style
 * @param {number} weight
 * @return {string}
 */
export function generateFontCacheKey(family, style, weight) {
    return `${family}${FONT_CACHE_KEY_SEPARATOR}${style}${FONT_CACHE_KEY_SEPARATOR}${weight}`;
}

/**
 * Generate a `FontRegistry` from a map of font families to their available font files. See the type jsdoc
 * definition above for details.
 *
 * @see https://fontdrop.info/ which can help identify characteristics about a font file
 * @see https://github.com/facebook/react-native/pull/23865 the relevant react-native bug
 * @see https://hiddentao.com/archives/2017/03/10/get-custom-fonts-working-in-react-native inspiration
 * @see FontFileDefinition
 *
 * @param {Map<string, FontFileDefinition[]>} fonts
 * @return {FontRegistry}
 */
export function createFontRegistry(fonts) {
    /**
     * Generate a flat cache of the fonts for quicker lookup. The cache keys are strings derived from the family name,
     * weight, and style. The values are the FontFileDefinition objects themselves.
     *
     * @type {Map<string, FontFileDefinition>}
     */
    const cache = new Map(
        [...fonts.entries()].reduce((cacheEntries, [family, files]) => {
            return [
                ...cacheEntries,
                ...files.map((file) => {
                    const { style, weight } = file;
                    return [generateFontCacheKey(family, style, weight), file];
                }),
            ];
        }, []),
    );

    /**
     * Lookup a font in the cache. Only matches exacts i.e. does not attempt to get closest weight etc. Returns null
     * if the exact match can't be found.
     *
     * @param {string} family
     * @param {string} style
     * @param {number} weight
     *
     * @return {FontFileDefinition|null}
     */
    function findInCache(family, style, weight) {
        return cache.get(generateFontCacheKey(family, style, weight)) || null;
    }

    /**
     * Lookup a font file in the registered fonts. Will always return a font file if at least one file is defined for the
     * family.
     *
     * If no exact style match is found, it will default to 'normal' and if 'normal' is not available it will default to
     * whatever's available.
     *
     * If no exact weight match is found, it will fud
     *
     * As long as `ignoreCache` is not true, matches will be cached for faster retrieval later.
     *
     * @param family
     * @param style
     * @param weight
     * @param ignoreCache
     * @return {{name?: string, fileName?: string, postScriptName?: string, weight?: number, style?: string}|null}
     */
    function lookup(
        family,
        { style = 'normal', weight = 400, ignoreCache = false } = {},
    ) {
        if (!family || !fonts.has(family) || !fonts.get(family).length) {
            // Trigger a RedBox error
            // eslint-disable-next-line no-console
            console.error(
                `No registered font family or font family has no font files: ${family}`,
            );
            return null;
        }
        // Attempt a cache lookup for an exact match.
        if (!ignoreCache) {
            const cachedFont = cache.get(
                generateFontCacheKey(family, weight, style),
            );
            if (cachedFont) {
                return cachedFont;
            }
        }
        // Generate an array of matched font files containing the index so it can be used during sort
        const fontFilesWithIndex = fonts
            .get(family)
            .map((file, index) => ({ file, index }));
        // Sort the matched font files sorting by closest style, then by closes weight, then by index (ascending)
        fontFilesWithIndex.sort(
            (
                {
                    file: { style: styleA = 'normal', weight: weightA = 400 },
                    index: indexA,
                },
                {
                    file: { style: styleB = 'normal', weight: weightB = 400 },
                    index: indexB,
                },
            ) => {
                // The distance of the style is one of: exact match (0), style is 'normal' (1), then everything else (2)
                const styleDistanceA =
                    styleA === style ? 0 : styleA === 'normal' ? 1 : 2;
                const styleDistanceB =
                    styleB === style ? 0 : styleB === 'normal' ? 1 : 2;
                // The distance of the weight is simply the absolute difference
                const weightDistanceA = Math.abs(weightA - weight);
                const weightDistanceB = Math.abs(weightB - weight);

                // Sort by styleDistance (asc), then by weightDistance (asc), then by index (asc, unique)
                if (styleDistanceA !== styleDistanceB) {
                    return styleDistanceA > styleDistanceB ? 1 : -1;
                } else if (weightDistanceA !== weightDistanceB) {
                    return weightDistanceA > weightDistanceB ? 1 : -1;
                } else {
                    return indexA > indexB ? 1 : -1;
                }
            },
        );
        // Our matched font is the top-ranked file which is the first in our sorted array
        const { file: fontFile } = fontFilesWithIndex[0];
        // If cache is enabled, add it to the cache
        if (!ignoreCache) {
            cache.set(generateFontCacheKey(family, style, weight), fontFile);
        }
        return fontFile;
    }

    /**
     * Generate "Text Style Props" that are platofrm specific for the nearest matching registered font variation
     * for the specified font family in this registry.
     *
     * It will always return a non-empty object if the font family has at least one file registered. Otherwise if the
     * family is unrecognized, it will return an empty styles object.
     *
     * Any additional properties passed to the second argument will be merged into the final styles object.
     *
     * @param {string} family
     * @param {string=} style
     * @param {number=} weight
     * @param rest
     * @param {boolean} ignoreCache
     * @return {{}}
     */
    function createFontStyles(
        family,
        { style = 'normal', weight = 400, ...rest } = {},
        { ignoreCache = false } = {},
    ) {
        const fontFile = lookup(family, { style, weight, ignoreCache });

        if (!fontFile) {
            return { ...rest };
        }

        const fileName = fontFile.fileName || fontFile.name;
        const postScriptName = fontFile.postScriptName || fontFile.name;

        return Platform.select({
            android: { fontFamily: fileName, ...rest },
            ios: {
                fontFamily: postScriptName,
                fontWeight: `${fontFile.weight || 400}`,
                fontStyle: `${fontFile.style || 'normal'}`,
                ...rest,
            },
        });
    }

    return {
        fonts,
        cache,
        findInCache,
        lookup,
        createFontStyles,
    };
}
