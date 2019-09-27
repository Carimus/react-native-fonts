import { createFontRegistry } from './createFontRegistry';

const setup = () => {
    return createFontRegistry(
        new Map([
            [
                'Montserrat',
                [
                    {
                        name: 'Montserrat-Regular',
                        weight: 400,
                        style: 'normal',
                    },
                    { name: 'Montserrat-Italic', weight: 400, style: 'italic' },
                    { name: 'Montserrat-Bold', weight: 700, style: 'normal' },
                    {
                        name: 'Montserrat-BoldItalic',
                        weight: 700,
                        style: 'italic',
                    },
                    {
                        name: 'Montserrat-ExtraBold',
                        weight: 800,
                        style: 'normal',
                    },
                    {
                        name: 'Montserrat-ExtraBoldItalic',
                        weight: 800,
                        style: 'italic',
                    },
                    { name: 'Montserrat-Light', weight: 300, style: 'normal' },
                    {
                        name: 'Montserrat-LightItalic',
                        weight: 300,
                        style: 'italic',
                    },
                    { name: 'Montserrat-Thin', weight: 250, style: 'normal' },
                    {
                        name: 'Montserrat-ThinItalic',
                        weight: 250,
                        style: 'italic',
                    },
                ],
            ],
            [
                'Montserrat-AllItalic',
                [
                    { name: 'Montserrat-Italic', weight: 400, style: 'italic' },
                    {
                        name: 'Montserrat-BoldItalic',
                        weight: 700,
                        style: 'italic',
                    },
                    {
                        name: 'Montserrat-ExtraBoldItalic',
                        weight: 800,
                        style: 'italic',
                    },
                    {
                        name: 'Montserrat-LightItalic',
                        weight: 300,
                        style: 'italic',
                    },
                    {
                        name: 'Montserrat-ThinItalic',
                        weight: 250,
                        style: 'italic',
                    },
                ],
            ],
        ]),
    );
};

test("findInCache can't find family's that don't exist", async () => {
    const { findInCache } = setup();
    expect(findInCache('FakeFontFamily', 'normal', 400)).toBeNull();
    expect(findInCache('FakeFontFamily', 'italic', 100)).toBeNull();
});

test("findInCache can't find inexact matches for existing font family", async () => {
    const { findInCache } = setup();
    expect(findInCache('Montserrat', 'normal', 999)).toBeNull();
});

test('findInCache can find exact matches in the prepopulated font cache', async () => {
    const { findInCache } = setup();
    expect(findInCache('Montserrat', 'normal', 400)).not.toBeNull();
    expect(findInCache('Montserrat', 'italic', 400)).not.toBeNull();
    expect(findInCache('Montserrat', 'normal', 250)).not.toBeNull();
    expect(findInCache('Montserrat', 'italic', 250)).not.toBeNull();
});

test('lookup returns null for invalid font families', async () => {
    const { lookup } = setup();
    // Suppress console.error
    const _console = global.console;
    global.console = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    expect(lookup('FakeFontFamily')).toBeNull();
    global.console = _console;
});

test('lookup returns a font if only specifying font family', async () => {
    const { lookup } = setup();
    expect(lookup('Montserrat')).not.toBeNull();
});

test('lookup returns a font with matching style, defaulting to normal, then defaulting to whatever is available', async () => {
    const { lookup } = setup();
    expect(lookup('Montserrat', { style: 'normal' })).toMatchObject({
        style: 'normal',
    });
    expect(lookup('Montserrat', { style: 'italic' })).toMatchObject({
        style: 'italic',
    });
    expect(lookup('Montserrat', { style: 'foo' })).toMatchObject({
        style: 'normal',
    });
    expect(lookup('Montserrat-AllItalic', { style: 'foo' })).toMatchObject({
        style: 'italic',
    });
});

test('lookup returns a font with matching weight', async () => {
    const { lookup } = setup();
    expect(lookup('Montserrat', { weight: 250 })).toMatchObject({
        weight: 250,
    });
    expect(lookup('Montserrat', { weight: 300 })).toMatchObject({
        weight: 300,
    });
    expect(lookup('Montserrat', { weight: 400 })).toMatchObject({
        weight: 400,
    });
    expect(lookup('Montserrat', { weight: 700 })).toMatchObject({
        weight: 700,
    });
    expect(lookup('Montserrat', { weight: 800 })).toMatchObject({
        weight: 800,
    });
});

test('lookup returns a font with closest weight if not available', async () => {
    const { lookup } = setup();
    expect(lookup('Montserrat', { weight: 100 })).toMatchObject({
        weight: 250,
    });
    expect(lookup('Montserrat', { weight: 200 })).toMatchObject({
        weight: 250,
    });
    expect(lookup('Montserrat', { weight: 274 })).toMatchObject({
        weight: 250,
    });
    expect(lookup('Montserrat', { weight: 276 })).toMatchObject({
        weight: 300,
    });
    expect(lookup('Montserrat', { weight: 500 })).toMatchObject({
        weight: 400,
    });
    expect(lookup('Montserrat', { weight: 600 })).toMatchObject({
        weight: 700,
    });
    expect(lookup('Montserrat', { weight: 700 })).toMatchObject({
        weight: 700,
    });
    expect(lookup('Montserrat', { weight: 800 })).toMatchObject({
        weight: 800,
    });
    expect(lookup('Montserrat', { weight: 900 })).toMatchObject({
        weight: 800,
    });
    expect(lookup('Montserrat', { weight: 1000 })).toMatchObject({
        weight: 800,
    });
});

test('lookup considers style and weight intelligently', async () => {
    const { lookup } = setup();
    expect(
        lookup('Montserrat', { weight: 100, style: 'italic' }),
    ).toMatchObject({ weight: 250, style: 'italic' });
    expect(lookup('Montserrat', { weight: 100, style: 'foo' })).toMatchObject({
        weight: 250,
        style: 'normal',
    });
    expect(
        lookup('Montserrat', { weight: 900, style: 'normal' }),
    ).toMatchObject({ weight: 800, style: 'normal' });
    expect(
        lookup('Montserrat', { weight: 900, style: 'italic' }),
    ).toMatchObject({ weight: 800, style: 'italic' });
    expect(lookup('Montserrat', { weight: 900, style: 'foo' })).toMatchObject({
        weight: 800,
        style: 'normal',
    });
    expect(
        lookup('Montserrat-AllItalic', { weight: 900, style: 'normal' }),
    ).toMatchObject({ weight: 800, style: 'italic' });
    expect(
        lookup('Montserrat-AllItalic', { weight: 900, style: 'italic' }),
    ).toMatchObject({ weight: 800, style: 'italic' });
    expect(
        lookup('Montserrat-AllItalic', { weight: 900, style: 'foo' }),
    ).toMatchObject({ weight: 800, style: 'italic' });
});

test('lookup populates cache appropriately', async () => {
    const { lookup, findInCache } = setup();
    expect(findInCache('Montserrat', 'foo', 900)).toBeNull();
    expect(lookup('Montserrat', { weight: 900, style: 'foo' })).toMatchObject({
        weight: 800,
        style: 'normal',
    });
    expect(findInCache('Montserrat', 'foo', 900)).toMatchObject({
        weight: 800,
        style: 'normal',
    });
});

describe('createFontStyles generates expected platform-specific font styles', () => {
    const platform = require('react-native').Platform.OS;

    test(`createFontStyles generates expected ${platform} font styles`, async () => {
        if (platform === 'ios') {
            const { createFontStyles } = setup();
            expect(
                createFontStyles('Montserrat', {
                    weight: 900,
                    style: 'italic',
                }),
            ).toMatchObject({
                fontFamily: 'Montserrat-ExtraBoldItalic',
                fontWeight: '800',
                fontStyle: 'italic',
            });
            expect(
                createFontStyles('Montserrat', {
                    weight: 100,
                    style: 'italic',
                }),
            ).toMatchObject({
                fontFamily: 'Montserrat-ThinItalic',
                fontWeight: '250',
                fontStyle: 'italic',
            });
            expect(
                createFontStyles('Montserrat', {
                    weight: 100,
                    style: 'normal',
                }),
            ).toMatchObject({
                fontFamily: 'Montserrat-Thin',
                fontWeight: '250',
                fontStyle: 'normal',
            });
        } else if (platform === 'android') {
            const { createFontStyles } = setup();
            const extraBoldItalic = createFontStyles('Montserrat', {
                weight: 900,
                style: 'italic',
            });
            const thinItalic = createFontStyles('Montserrat', {
                weight: 100,
                style: 'italic',
            });
            const thinNormal = createFontStyles('Montserrat', { weight: 100 });
            const normal = createFontStyles('Montserrat');
            expect(extraBoldItalic).toMatchObject({
                fontFamily: 'Montserrat-ExtraBoldItalic',
            });
            expect(extraBoldItalic).not.toHaveProperty('fontWeight');
            expect(extraBoldItalic).not.toHaveProperty('fontStyle');
            expect(thinItalic).toMatchObject({
                fontFamily: 'Montserrat-ThinItalic',
            });
            expect(thinItalic).not.toHaveProperty('fontWeight');
            expect(thinItalic).not.toHaveProperty('fontStyle');
            expect(thinNormal).toMatchObject({ fontFamily: 'Montserrat-Thin' });
            expect(thinNormal).not.toHaveProperty('fontWeight');
            expect(thinNormal).not.toHaveProperty('fontStyle');
            expect(normal).toMatchObject({ fontFamily: 'Montserrat-Regular' });
            expect(normal).not.toHaveProperty('fontWeight');
            expect(normal).not.toHaveProperty('fontStyle');
        } else {
            throw new Error(`Invalid platform: ${platform}`);
        }
    });
});
