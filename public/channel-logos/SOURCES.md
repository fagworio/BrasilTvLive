# Channel logo sources

These assets are real channel marks sourced from existing public brand/logo repositories or project assets. No channel logo was invented in the BrasilTvLive UI.

| Asset | Used by | Source |
| --- | --- | --- |
| `tv-brasil.svg` | TV Brasil, TV Brasil Internacional | https://github.com/limaalef/limaalef.github.io/blob/main/channel_logos/tv_brasil.svg |
| `canal-gov.svg` | Canal Gov | https://github.com/tv-logo/tv-logos/blob/main/countries/brazil/canal-gov-br.png |
| `tv-camara.svg` | TV Câmara, TV Câmara 2 | https://github.com/tv-logo/tv-logos/blob/main/countries/brazil/tv-camara-br.png |
| `sbt.svg` | SBT Nacional / regional fallback | https://github.com/limaalef/limaalef.github.io/blob/main/channel_logos/sbt.svg |
| `sbt-news.svg` | SBT News | https://github.com/RogerioLira-centralcomm/aicentralv2/blob/main/aicentralv2/static/images/creative-viewers/sbt-news.svg |
| `record.svg` | RECORD Nacional and regional RECORD stations | https://github.com/limaalef/limaalef.github.io/blob/main/channel_logos/record.svg |
| `record-news.svg` | RECORD News | https://github.com/limaalef/limaalef.github.io/blob/main/channel_logos/record_news.svg |
| `band.svg` | Band Nacional and regional Band stations | https://github.com/limaalef/limaalef.github.io/blob/main/channel_logos/band.svg |
| `redetv.svg` | RedeTV! Nacional | https://github.com/tv-logo/tv-logos/blob/main/countries/brazil/rede-tv-br.png |
| `globo.svg` | Globo Nacional, Globo Minas, Globo SP, Globo Rio | https://github.com/tv-logo/tv-logos/blob/main/countries/brazil/globo-br.png |
| `tv-integracao.svg` | TV Integração | https://github.com/thalesboss/TvIntegracao/blob/main/assets/images/logo-tv-integracao.png |

## SVG packaging

Where a native SVG source was available, the original vector file is stored unchanged.

For sources available only as PNG, the original image bytes are embedded inside an SVG container. This keeps the app asset contract consistently SVG without redrawing, tracing, approximating, or modifying the channel logo.
