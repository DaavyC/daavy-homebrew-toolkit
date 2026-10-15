# Daavy's Homebrew Toolkit

Homebrew builders for Pathfinder 2e.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/daavy)

## Features

- **Creature Builder:** Creates PF2e NPCs from a guided form with a live preview and balance checks.
- **Inline Builder:** Creates area templates, damage rolls, saving throws, and outcome effects for PF2e descriptions.

## Creature Builder

GMs see a **Creature Builder** button in the Actors tab. It opens a window with the form.

| Section | Contents |
| --- | --- |
| Identity | Name, level, role, size, rarity, traits, languages, speed, and extra speeds. |
| Attributes | Attribute modifiers, Perception, senses, and skills, including Lore. |
| Defenses | AC, saves, HP, immunities, resistances, and weaknesses. |
| Strikes | Melee or ranged attacks with bonus, damage, damage type, traits, and extra damage. |
| Abilities | Native abilities and custom abilities with an action cost, category, and description. |
| Spells | Tradition, preparation type, spell DC and attack, and slots by rank, including cantrips. |

Click **Create creature** to create the NPC and open its sheet.

## Inline Builder

Open the Inline Builder from the wand button in a description editor, or press `Ctrl + Shift + T`. The Inline Builder reads any compatible text already in the description.

- Create `@Template` text for burst, cone, square, and line areas.
- Create `@Damage` text with a damage type and traits.
- Create `@Check` text with a save type, DC, basic save, and DC visibility.
- Use NPC level suggestions for DCs and damage.
- Add conditions, damage, and persistent damage to critical success, success, failure, and critical failure outcomes.

### Automations

Automations use Daavy's Addons. Turn on Target Helper and Template Helper there to place templates from item cards. Turn on Automations to roll saves for the selected targets. Each result's conditions and damage then apply to them. A GM must be online, and the sender must own the source actor or be the GM.

## Settings

| Setting | Effect |
| --- | --- |
| Theme | Sets the toolkit windows to the Default or Light appearance. Each user sets their own. |

## Installation

In Foundry VTT, open Add-on Modules, choose Install Module, and enter the manifest URL:

<https://github.com/DaavyC/daavy-homebrew-toolkit/releases/latest/download/module.json>

## Compatibility

- Foundry VTT 14
- Pathfinder 2e system

## Credits

- [PF2e See Simple Scale Statistics](https://github.com/shemetz/pf2e-see-simple-scale-statistics) by shemetz. Some of the Creature Builder balance check rules come from it.
