const { defineConfig, globalIgnores } = require("eslint/config");

const babelParser = require("@babel/eslint-parser");
const globals = require("globals");
const stylisticJs = require("@stylistic/eslint-plugin-js");
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([
    {
        languageOptions: {
            ecmaVersion: 13,
            sourceType: "module",

            parserOptions: {
                extraFileExtensions: [".cjs", ".mjs"],
                requireConfigFile: false
            },

            parser: babelParser,

            globals: {
                ...globals.browser,
                ...globals.jquery,
                CONFIG: false,
                CONST: false,
                PIXI: false,
                ActiveEffect: false,
                Actor: false,
                ActorSheet: false,
                ChatMessage: false,
                Combat: false,
                CombatTracker: false,
                CombatTrackerConfig: false,
                Compendium: false,
                ContextMenu: false,
                Dialog: false,
                DocumentSheet: false,
                Folder: false,
                FormApplication: false,
                Handlebars: false,
                Item: false,
                ItemSheet: false,
                Journal: false,
                JournalSheet: false,
                FilePicker: false,
                Hooks: false,
                Macro: false,
                Roll: false,
                SettingsConfig: false,
                TextEditor: false,
                TokenDocument: false,
                VisionMode: false,
                canvas: false,
                dragRuler: false,
                game: false,
                foundry: false,
                fromUuid: false,
                fromUuidSync: false,
                globalThis: false,
                ui: false,
                
                SACRAMENTO_RPG: false,
                SacramentoRPGActor: false,
                SacramentoRPGItem: false
            }
        },

        extends: compat.extends("eslint:recommended"),

        plugins: {
            "@stylistic/js": stylisticJs
        },

        rules: {
            "array-bracket-spacing": ["warn", "never"],
            "arrow-spacing": "warn",
            "brace-style": "warn",
            "comma-dangle": ["warn", "never"],
            "comma-style": "warn",
            "computed-property-spacing": "warn",
            "constructor-super": "error",
            "default-param-last": "warn",
            "dot-location": ["warn", "property"],
            "eol-last": ["error", "always"],
            eqeqeq: ["warn", "smart"],
            "func-call-spacing": "warn",
            "getter-return": "warn",

            indent: [
                "warn",
                "tab",
                {
                    SwitchCase: 1
                }
            ],

            "lines-between-class-members": "warn",
            "new-parens": ["warn", "always"],
            "no-alert": "warn",
            "no-const-assign": "error",
            "no-constructor-return": "warn",
            "no-dupe-args": "warn",
            "no-dupe-class-members": "warn",
            "no-dupe-keys": "warn",
            "no-duplicate-case": "warn",
            "no-duplicate-imports": ["warn", { includeExports: true }],
            "no-empty": ["warn", { allowEmptyCatch: true }],
            "no-func-assign": "warn",
            "no-global-assign": "warn",
            "no-implied-eval": "warn",
            "no-invalid-regexp": "warn",
            "no-irregular-whitespace": "warn",
            "no-mixed-operators": "warn",
            "no-multi-str": "warn",
            "no-multiple-empty-lines": ["warn", { max: 1 }],
            "no-new-func": "warn",
            "no-new-object": "warn",
            "no-new-symbol": "warn",
            "no-new-wrappers": "warn",
            "no-obj-calls": "warn",
            "no-promise-executor-return": "warn",
            "no-proto": "warn",
            "no-prototype-builtins": "warn",
            "no-self-assign": "warn",
            "no-self-compare": "warn",
            "no-setter-return": "warn",
            "no-this-before-super": "error",
            "no-unreachable": "warn",
            "no-unsafe-negation": ["warn", { enforceForOrderingRelations: true }],
            "no-unsafe-optional-chaining": ["warn", { disallowArithmeticOperators: true }],
            "no-unused-expressions": "warn",
            "no-useless-call": "warn",
            "no-useless-catch": "warn",
            "no-useless-computed-key": ["warn", { enforceForClassMembers: true }],
            "no-useless-constructor": "warn",
            "no-useless-rename": "warn",
            "no-useless-return": "warn",
            "no-var": "warn",
            "no-void": "warn",
            "prefer-const": "warn",
            "prefer-numeric-literals": "warn",
            "prefer-object-spread": "warn",
            "prefer-spread": "warn",
            "semi": "warn",
            "quotes": ["warn", "double", { avoidEscape: true, allowTemplateLiterals: false }],

            "prettier/prettier": [
                "error",
                {
                    experimentalOperatorPosition: "start",
                    printWidth: 120,
                    trailingComma: "none",
                    singleQuote: false,
                    tabWidth: 4, 
                    useTabs: true 
                }
            ]
        },

        settings: {}
    },
    globalIgnores(["**/foundry", "**/utils", "**/dist", "**/node_modules"]),
    {
        files: ["./*.js", "./*.cjs", "./*.mjs"],

        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    },
    eslintPluginPrettierRecommended
]);