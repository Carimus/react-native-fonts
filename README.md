# `@carimus/react-native-fonts`

A React Native package that provides some basic utilities and tools for working with custom fonts.

## Motivation

React Native has a deficiency in how it handles custom fonts. There's lots of workarounds but if you use custom fonts
in a lot of places in the app, they can get cumbersome.

This repository aims to provider helpers that make it easy to generate platform-specific
[`Text Style Props`](https://facebook.github.io/react-native/docs/text-style-props) for custom fonts, esp. those that
use different font files for all permutations of weight and style.

## Example

First, ensure you're font files are stored in your project's assets directory which you set via `react-native.config.js`
and that you've run `react-native link` in order to link the font files into your native iOS and Android code.

Then you need to create a `FontRegistry` by giving the `createFontRegistry` function a `Map` of font family names
to an array of their files. The files are defined in the form of `FontFileDefinition` objects which describe when
a font should be picked and how it should be referenced within the RN styles (which is platform-dependent).

Once you have a font registry you can use its `createFontStyles` method to generate platform-specific font styles for a
font family you've registered and for any weight and style variation (the closest match is found among the files you've
defined).

```javascript
import { View, Text } from 'react-native';
import { createFontRegistry } from '@carimus/react-native-fonts';

const fonts = new Map([
    [
        'Montserrat',
        [
            { name: 'Montserrat-Regular', weight: 400, style: 'normal' },
            { name: 'Montserrat-Italic', weight: 400, style: 'italic' },
            { name: 'Montserrat-Bold', weight: 700, style: 'normal' },
            { name: 'Montserrat-BoldItalic', weight: 700, style: 'italic' },
            { name: 'Montserrat-ExtraBold', weight: 800, style: 'normal' },
            {
                name: 'Montserrat-ExtraBoldItalic',
                weight: 800,
                style: 'italic',
            },
            { name: 'Montserrat-Light', weight: 300, style: 'normal' },
            { name: 'Montserrat-LightItalic', weight: 300, style: 'italic' },
            { name: 'Montserrat-Thin', weight: 250, style: 'normal' },
            { name: 'Montserrat-ThinItalic', weight: 250, style: 'italic' },
        ],
    ],
]);

const { createFontStyles } = createFontRegistry(fonts);

function MyComponent() {
    return (
        <View>
            <Text style={createFontStyles('Montserrat')}>Some normal text</Text>
            <Text style={createFontStyles('Montserrat', { weight: 700 })}>
                Some bold text
            </Text>
            <Text
                style={{
                    ...createFontStyles('Montserrat', {
                        weight: 700,
                        style: 'italic',
                    }),
                    color: '#FF0000',
                }}
            >
                Some bold, italic, red text.
            </Text>
        </View>
    );
}
```

### Important Notes

-   You can use [FontDrop!](https://fontdrop.info/) to quickly get info like the weight (`usWeightClass`), style
    (`fontSubfamily` kinda, you have to infer; "Heavy Italic" or anything containing the word "Italic"
    translate to `'italic'`; everything else like "Regular", "Heavy", or "Black" etc. translates to `'normal'`), and
    `postScriptName`.
-   iOS requires you use the `postScriptName` when you reference a `fontFamily` in RN Text Style Props but in Android,
    you have to use the font's filename without the extension. So in general, you should name your font files such that
    the file name w/o the extension is the same as the `postScriptName` of the font. If you do so you can use the `name`
    property in the font file definition object as shown in the example above with "Montserrat". If the filename differs
    for whatever reason from the `postScriptName`, you must explicitly specify `postScriptName` and `fileName` instead.
-   The `weight` must be a number between `100` and `900` in increments of `50`.
-   The `style` must be either `'normal'` or `italic`.

## TODO

-   [ ] More detailed documentation instead of just an example.
