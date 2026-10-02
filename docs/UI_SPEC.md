# BrasilTvLive - UI Specification for MVP 0.1

## Source of truth

The canonical visual reference is:

`docs/references/brasiltvlive-mockup.png`

When this document and the image differ visually, the image wins unless the user explicitly changes the design.

## TV target

Primary viewport: `1920x1080`, 16:9.

The TV screen has three dominant visual regions:

1. Left sidebar, dark and persistent.
2. Upper-right hero/current-program presentation.
3. Lower-right EPG grid/timeline.

### Sidebar

Reproduce the reference hierarchy and density:

- BrasilTvLive logo/wordmark at the top.
- Items for Favoritos, Ao vivo, Noticias, Filmes, Esportes, Infantil, Minas Gerais and Configuracoes.
- `Ao vivo` begins selected.
- Selected item uses a darker/lighter elevated panel, green accent bar at the left, green icon/accent and white primary text.
- Secondary channel-count text is dimmer.
- Sidebar should visually blend into the hero rather than look like a separate white-box panel.

### Hero/current program

Reproduce:

- red `AO VIVO` badge;
- `TV Brasil` channel title;
- `Reporter Brasil` as the dominant program title;
- program time/date metadata;
- short description;
- full-bleed background artwork on the right;
- strong dark gradient from the left and lower edge so text remains readable;
- no visible rectangular thumbnail boundary around the hero image.

For the first implementation, use local placeholder artwork when the exact generated scene is not available separately. The layout, contrast, gradients and hierarchy matter more than reproducing a specific person in the reference image.

### EPG grid

Include mock rows for:

- TV Brasil
- TV Camara
- TV Senado
- Canal Gov
- TV Justica

Include time columns similar to the mockup and a red current-time marker at approximately `13:42`.

Program cells must have visible default and focused/selected styles. The highlighted current program in the reference uses a blue focus/selection outline.

### Visual priorities

Match, in this order:

1. layout proportions;
2. spacing and alignment;
3. typography hierarchy;
4. panel/card dimensions;
5. gradients and contrast;
6. selected/focused states;
7. icons and decorative detail.

Do not spend time creating infrastructure to pixel-diff the design during the first milestone. A rendered screenshot compared directly with the reference is sufficient.

## Mobile target

The mobile composition is not a scaled-down TV screen.

Use the same visual language and shared data, but compose a phone-specific layout with:

- top header with menu, brand and search;
- video/player area near the top;
- current channel/program information;
- favorite action;
- category chips;
- vertical channel list;
- bottom navigation.

Initial reference sizes:

- 390x844
- 430x932

Mobile implementation starts only after the TV screen has been visually accepted.
