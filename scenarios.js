/* ===================================================================
   The Prince's Dilemma — Scenario deck
   Each card is built on a real teaching from Machiavelli's "The Prince".
   effects: how each reply moves the four pillars (range roughly -25..+25)
     authority 👑 | army ⚔️ | people ❤️ | treasury 💰
   lesson: the Machiavellian principle the card illustrates.
   ================================================================== */

const SCENARIOS = [
  {
    portrait: "🧔",
    name: "Captain Orsino",
    text: "Sire, the people adore you, yet the barons whisper of revolt. Shall I station soldiers in the city to remind them who rules?",
    left:  { label: "No, trust their love", effects: { authority: -8, army: -4, people: +10, treasury: +2 } },
    right: { label: "Yes, show the swords", effects: { authority: +12, army: +6, people: -8, treasury: -6 } },
    lesson: "Machiavelli warns that love is held by a bond of obligation which, men being wicked, is broken whenever it serves them. Fear, sustained by the dread of punishment, never fails — but it must never become hatred."
  },
  {
    portrait: "🎖️",
    name: "General Vitelli",
    text: "We can hire mercenaries to win the coming war cheaply and quickly. Their captain awaits your gold.",
    left:  { label: "No, raise our own men", effects: { authority: +8, army: +14, people: +4, treasury: -16 } },
    right: { label: "Yes, hire the sellswords", effects: { authority: -6, army: +10, people: -4, treasury: -8 } },
    lesson: "Mercenaries are 'disunited, ambitious, and faithless.' Machiavelli held that a prince's own arms are the only true foundation of power — borrowed swords win the battle and lose the state."
  },
  {
    portrait: "🤵",
    name: "Chancellor Soderini",
    text: "Your treasury runs low. We could raise taxes on the merchants to refill the coffers.",
    left:  { label: "No, spare their purses", effects: { authority: -4, army: -2, people: +10, treasury: -10 } },
    right: { label: "Yes, tax them heavily", effects: { authority: +4, army: +2, people: -12, treasury: +16 } },
    lesson: "A wise prince guards against being a heavy spender, for liberality eventually breeds the very taxes that earn hatred. Yet rob the people too deeply and you 'open the way to plunder.' Spend your own; spare your subjects'."
  },
  {
    portrait: "🧙",
    name: "The Court Astrologer",
    text: "The omens favor a bold conquest of the neighboring duchy. Fortune, they say, favors the audacious.",
    left:  { label: "No, hold our borders", effects: { authority: -4, army: +2, people: +4, treasury: +6 } },
    right: { label: "Yes, ride to conquest", effects: { authority: +10, army: -10, people: -2, treasury: -8 } },
    lesson: "'Fortune is the arbiter of half our actions, but she leaves the other half to us.' Machiavelli likened her to a river — dangerous, yet tamed by him who prepares dykes in advance. Boldness wins her favor, but only when armed."
  },
  {
    portrait: "🗡️",
    name: "Spymaster Ravenna",
    text: "We have uncovered a conspiracy among three nobles. Do we strike them all down at once, or watch and wait?",
    left:  { label: "Watch and wait", effects: { authority: -10, army: 0, people: +4, treasury: +2 } },
    right: { label: "Strike at once", effects: { authority: +12, army: +2, people: -10, treasury: -4 } },
    lesson: "Cruelty must be 'well used' — committed at a stroke, for self-preservation, and not repeated. Injuries should be done all together, that being tasted less, they offend less; benefits should be granted little by little."
  },
  {
    portrait: "⛪",
    name: "Bishop Adriano",
    text: "The Church offers its blessing — and an alliance — if you fund a grand cathedral in your name.",
    left:  { label: "Decline the costly honor", effects: { authority: -2, army: 0, people: -4, treasury: +8 } },
    right: { label: "Build it gloriously", effects: { authority: +8, army: 0, people: +12, treasury: -16 } },
    lesson: "A prince should appear merciful, faithful, and religious above all — for men judge by the eye. To seem devout is a mighty shield, since 'everyone sees what you appear to be, few touch what you are.'"
  },
  {
    portrait: "👸",
    name: "Lady Caterina",
    text: "A marriage alliance with a powerful neighbor is offered. It brings safety — but binds you to their wars.",
    left:  { label: "Stay independent", effects: { authority: +6, army: -6, people: +2, treasury: +2 } },
    right: { label: "Seal the alliance", effects: { authority: -2, army: +12, people: 0, treasury: +4 } },
    lesson: "A prince must take care never to ally with one more powerful than himself to attack others, save by necessity — 'for if he conquers, you are at his discretion.' Neutrality, too, makes you the prey of the victor."
  },
  {
    portrait: "🧑‍🌾",
    name: "A Peasant Delegation",
    text: "A famine spreads through the countryside. The farmers beg you to open the royal granaries.",
    left:  { label: "Keep the reserves", effects: { authority: +4, army: +2, people: -14, treasury: +6 } },
    right: { label: "Open the granaries", effects: { authority: +6, army: 0, people: +16, treasury: -12 } },
    lesson: "Above all, a prince must avoid the people's hatred. The best fortress is to be not hated by the people — for with them on his side, no conspirator can find footing, and no invader can hold the land."
  },
  {
    portrait: "🎭",
    name: "Minister Borgia",
    text: "Your harsh enforcer has crushed all disorder — and the people now despise him for his cruelty. What is your will?",
    left:  { label: "Defend your loyal man", effects: { authority: -8, army: +2, people: -12, treasury: 0 } },
    right: { label: "Sacrifice him publicly", effects: { authority: +14, army: 0, people: +14, treasury: -4 } },
    lesson: "Borgia set the cruel Remirro de Orco to pacify a province, then had him cut in two in the public square — 'to clear himself of blame.' Delegate the harsh deeds; reserve the mercy and the credit for yourself."
  },
  {
    portrait: "📜",
    name: "Old Counselor Pazzi",
    text: "You have just seized this territory. The former duke's bloodline still lives in exile. Shall we let them be?",
    left:  { label: "Show mercy, let them live", effects: { authority: -12, army: -2, people: +6, treasury: -2 } },
    right: { label: "End the old line", effects: { authority: +14, army: +2, people: -8, treasury: -2 } },
    lesson: "When you seize a state, 'the line of the former prince must be extinguished.' Men forget the loss of a ruler sooner than the loss of their patrimony — but a surviving claimant is a flag every rebel will rally to."
  },
  {
    portrait: "🏛️",
    name: "The City Elders",
    text: "Our new province kept its own laws and language. Do we let them govern as before, or impose our customs?",
    left:  { label: "Let them keep their ways", effects: { authority: -6, army: -2, people: +8, treasury: +2 } },
    right: { label: "Go dwell among them", effects: { authority: +12, army: +2, people: +4, treasury: -10 } },
    lesson: "To hold a province of differing tongue and custom, the surest remedy is for the prince to go and live there. 'Being on the spot, disorders are seen as they spring up' — and the people, having access to him, grow content."
  },
  {
    portrait: "💰",
    name: "Treasurer Medici",
    text: "You could win great love by hosting lavish feasts and public games for the city. The cost would be considerable.",
    left:  { label: "Rule with thrift", effects: { authority: +6, army: +2, people: -8, treasury: +12 } },
    right: { label: "Dazzle them with splendor", effects: { authority: +4, army: 0, people: +14, treasury: -16 } },
    lesson: "A reputation for liberality is won at the cost of liberality itself — and ends in poverty, contempt, or hatred when the gold runs out. Better to be thought a touch miserly: it is a vice that lets you reign."
  },
  {
    portrait: "🐺",
    name: "Envoy of a Rival",
    text: "A neighboring prince has broken his oath to you and seized a border town. Do you honor your own treaty with him?",
    left:  { label: "Keep your sworn word", effects: { authority: -10, army: -4, people: +8, treasury: -4 } },
    right: { label: "Break it as he did", effects: { authority: +10, army: +4, people: -6, treasury: +4 } },
    lesson: "A prudent ruler cannot keep faith when it works against him and the reasons that bound him are gone. 'A wise lord must know how to use the beast' — be a fox to spy the snares, a lion to frighten the wolves."
  },
  {
    portrait: "🎓",
    name: "The Young Heir",
    text: "Your court flatterers sing only your praises. A blunt old advisor asks leave to always tell you the hard truth.",
    left:  { label: "Keep the pleasant voices", effects: { authority: -8, army: -4, people: -2, treasury: +4 } },
    right: { label: "Grant him free speech", effects: { authority: +10, army: +4, people: +4, treasury: -2 } },
    lesson: "Flatterers are a plague every court invites. Guard against them by choosing wise men and granting them alone the liberty to speak truth — but only on what you ask. A prince who is not wise himself can never be well advised."
  },
  {
    portrait: "🛡️",
    name: "Master of the Keep",
    text: "Shall we pour our gold into a mighty fortress to retreat to, or trust instead in the goodwill of the people?",
    left:  { label: "Trust the people's love", effects: { authority: +4, army: +2, people: +12, treasury: +2 } },
    right: { label: "Build the great fortress", effects: { authority: +6, army: +6, people: -12, treasury: -14 } },
    lesson: "'The best fortress is to be found in the love of the people, for although you have fortresses, they will not save you if you are hated.' Walls keep out the foreign foe but never the wrath of your own subjects."
  },
  {
    portrait: "⚖️",
    name: "Judge Colonna",
    text: "A beloved war hero has grown so popular the crowds chant his name above yours. How do you treat his rising glory?",
    left:  { label: "Honor him still higher", effects: { authority: -12, army: +6, people: +6, treasury: -4 } },
    right: { label: "Quietly clip his wings", effects: { authority: +12, army: -6, people: -4, treasury: +2 } },
    lesson: "A prince must watch that no subject grows great enough to become a danger. Power that rivals your own is a debt that will one day be called in — temper it before gratitude curdles into ambition."
  },
  {
    portrait: "🔥",
    name: "Refugee Lord",
    text: "A deposed prince begs your aid to retake his land, swearing eternal loyalty in return. Do you commit your army?",
    left:  { label: "Refuse the gamble", effects: { authority: +2, army: +4, people: 0, treasury: +4 } },
    right: { label: "Send your forces", effects: { authority: +6, army: -12, people: -2, treasury: -8 } },
    lesson: "He who is the cause of another's greatness is himself undone — for he builds that power by craft or force, and both make the one he raised suspicious of him. Lend strength sparingly, and never on another's promise alone."
  },
  {
    portrait: "🌾",
    name: "Guildmaster Ferro",
    text: "The artisans and traders are the lifeblood of your wealth. They ask for charters protecting their freedoms.",
    left:  { label: "Deny — keep them dependent", effects: { authority: +8, army: 0, people: -10, treasury: +6 } },
    right: { label: "Grant the charters", effects: { authority: -2, army: 0, people: +12, treasury: +8 } },
    lesson: "A prince who has the people for his foundation, and knows how to command, will not be deceived. Bind the productive classes to your fortune, and in times of danger they will not desert you — for their interest is your throne."
  },
  {
    portrait: "🏰",
    name: "Defeated Rebel",
    text: "A province you conquered has risen in revolt, and you have crushed it a second time. How do you secure it now?",
    left:  { label: "Forgive and rebuild trust", effects: { authority: -10, army: -4, people: +6, treasury: -6 } },
    right: { label: "Garrison it harshly", effects: { authority: +8, army: -4, people: -8, treasury: -8 } },
    lesson: "Rebellious states once retaken are held with more difficulty — but the revolt gives the prince freer license to punish the guilty, expose the suspect, and strengthen the weakest parts. A second mercy invites a third revolt."
  },
  {
    portrait: "🦊",
    name: "The Sly Diplomat",
    text: "You can win a crucial treaty by making a solemn promise you have no intention of keeping. Do you give your word?",
    left:  { label: "Promise only what you'll keep", effects: { authority: -6, army: -4, people: +8, treasury: -4 } },
    right: { label: "Promise, and deceive", effects: { authority: +10, army: +4, people: -4, treasury: +6 } },
    lesson: "Men are so simple, and so bound by present needs, that the deceiver will always find someone willing to be deceived. Yet Machiavelli adds the warning: never let the mask slip, for a prince caught in the lie is a prince destroyed."
  },
  {
    portrait: "🕊️",
    name: "The Weary Bishop",
    text: "After years of war, the realm longs for peace. Your generals, hungry for glory, push for one more campaign.",
    left:  { label: "Make peace, rebuild", effects: { authority: -2, army: -6, people: +12, treasury: +8 } },
    right: { label: "Wage one last war", effects: { authority: +8, army: +6, people: -8, treasury: -12 } },
    lesson: "A prince must have no other aim than war, its methods and discipline — yet Machiavelli prized the prince who in peace prepares, so that 'when fortune changes, she may find him ready.' Idle peace ruins armies; endless war ruins states."
  },
  {
    portrait: "👑",
    name: "Your Own Conscience",
    text: "To do great good for your realm, you must commit a single cold, ruthless act that your soul recoils from.",
    left:  { label: "Keep your hands clean", effects: { authority: -12, army: -4, people: +6, treasury: -2 } },
    right: { label: "Do what must be done", effects: { authority: +12, army: +4, people: -4, treasury: +2 } },
    lesson: "A prince must learn 'how not to be good, and to use this knowledge or not according to necessity.' To cling to virtue among so many who are not virtuous is to ensure your own ruin — govern the act, not the sentiment."
  },
  {
    portrait: "🏗️",
    name: "Architect Bramante",
    text: "A rival prince rose to power through sheer luck and the favor of his patrons. You climbed by your own strength. He now seeks your friendship.",
    left:  { label: "Embrace him as an equal", effects: { authority: -10, army: -6, people: +2, treasury: +6 } },
    right: { label: "Keep him at arm's length", effects: { authority: +8, army: +4, people: -2, treasury: +2 } },
    lesson: "Those who become princes by fortune do so with little effort, but maintain themselves with great difficulty — for they 'have no roots.' He who rises by his own arms and virtue lays foundations that storms cannot easily topple."
  },
  {
    portrait: "🎻",
    name: "The Idle Courtier",
    text: "Peace has settled on the realm. Your nobles urge you to set aside war and devote your days to the hunt, music, and pleasure.",
    left:  { label: "Indulge in the good life", effects: { authority: -8, army: -12, people: +6, treasury: -4 } },
    right: { label: "Drill and prepare for war", effects: { authority: +8, army: +12, people: -4, treasury: -6 } },
    lesson: "The chief cause of losing a state is the neglect of the art of war. In peace a prince should think on it more than ever — by the hunt, by study of history, by mapping the land — so that adversity never finds him unprepared."
  },
  {
    portrait: "🗿",
    name: "Statue of the Old King",
    text: "You may model your reign on a legendary ruler of the past — aiming for his impossible greatness, even if you fall short.",
    left:  { label: "Aim modestly, surely", effects: { authority: -6, army: -2, people: +4, treasury: +4 } },
    right: { label: "Aim for the heights", effects: { authority: +12, army: +4, people: +2, treasury: -6 } },
    lesson: "A prudent man should ever follow the paths of great men and imitate the excellent, 'so that if his virtue does not reach theirs, at least it may give off some scent of it.' Be the archer who aims high to strike his true mark."
  },
  {
    portrait: "🩸",
    name: "Captain of the Guard",
    text: "An ambitious noble plots against your life. You can act now on suspicion alone, or wait until you hold certain proof.",
    left:  { label: "Wait for hard proof", effects: { authority: -12, army: -2, people: +4, treasury: 0 } },
    right: { label: "Move on suspicion now", effects: { authority: +10, army: +2, people: -8, treasury: -2 } },
    lesson: "On conspiracies: the conspirator acts alone in fear and suspicion, while a prince loved by his people stands behind the majesty of the state. Deny plotters that hope — yet a ruler who suspects all, and strikes the innocent, breeds the very enemies he fears."
  },
  {
    portrait: "📯",
    name: "The Herald",
    text: "A momentous deed is yours to claim — a great public victory. Do you announce it yourself, or let it be carried out in another's name?",
    left:  { label: "Let another take the stage", effects: { authority: -8, army: 0, people: -6, treasury: +2 } },
    right: { label: "Claim the glory yourself", effects: { authority: +12, army: +2, people: +8, treasury: -4 } },
    lesson: "Great enterprises and noble examples keep a prince's name high. Nothing makes him so esteemed as great undertakings done in his own name — for men are won by the present spectacle of greatness far more than by quiet, hidden worth."
  },
  {
    portrait: "🧮",
    name: "Tax Collector Bruno",
    text: "A conquered city was wealthy and used to its own freedoms. Holding it strains you. How shall you secure it for good?",
    left:  { label: "Rule it from afar by force", effects: { authority: -6, army: -8, people: -6, treasury: -4 } },
    right: { label: "Let it self-rule under tribute", effects: { authority: +6, army: +2, people: +8, treasury: +6 } },
    lesson: "Cities used to liberty are best held in three ways: ruin them, dwell in them, or let them live under their own laws while drawing tribute and installing a friendly few. A free city not destroyed will 'never forget the name of liberty.'"
  },
  {
    portrait: "🤝",
    name: "Two Rival Lords",
    text: "Two great houses war at your doorstep. You can stay neutral and watch, or openly commit your banner to one side.",
    left:  { label: "Stay carefully neutral", effects: { authority: -10, army: +2, people: 0, treasury: +4 } },
    right: { label: "Declare for one side boldly", effects: { authority: +10, army: -4, people: +2, treasury: -6 } },
    lesson: "A prince is esteemed when he is a true friend or an open enemy — declaring himself without reserve. Neutrality earns the hatred of the loser and the contempt of the winner; the irresolute prince, to escape present danger, most often runs straight into it."
  },
  {
    portrait: "🍷",
    name: "The Poisoner's Offer",
    text: "A shadowy figure offers to quietly remove your most dangerous enemy — by means best left unspoken.",
    left:  { label: "Refuse such dark means", effects: { authority: -8, army: -4, people: +8, treasury: -2 } },
    right: { label: "Accept the quiet solution", effects: { authority: +10, army: +2, people: -6, treasury: -4 } },
    lesson: "Machiavelli judged deeds by their end: cruelty may be excused when it secures the state and is not prolonged. Yet he warned that power won by infamy and bloodshed brings glory never — such victories may save the throne but damn the name."
  },
  {
    portrait: "🌹",
    name: "Lady of the Court",
    text: "Fortune has smiled on you for years without effort. An advisor warns that easy times breed soft habits. Do you heed her?",
    left:  { label: "Ride your good fortune", effects: { authority: +4, army: -8, people: +6, treasury: +6 } },
    right: { label: "Steel yourself for the turn", effects: { authority: +8, army: +10, people: -4, treasury: -6 } },
    lesson: "Fortune shows her power where no prepared strength resists her, and turns her fury where no dykes are raised. She is a woman, says Machiavelli, and friend to the young and bold who command her — but she abandons the prince who leans on her alone."
  },
  {
    portrait: "⚒️",
    name: "Foreman of the Mines",
    text: "You could fund your reign through your own lands and industry, or by leaning on the gold of a wealthy foreign backer.",
    left:  { label: "Lean on the rich patron", effects: { authority: -10, army: -2, people: 0, treasury: +14 } },
    right: { label: "Build self-sufficient wealth", effects: { authority: +8, army: +4, people: +4, treasury: -8 } },
    lesson: "A prince who depends on the resources and goodwill of others stands on sand. Self-sufficient arms and revenue let him 'defend himself against whoever assails him' — the dependent ruler is a guest in his own house, dismissed at his patron's whim."
  },
  {
    portrait: "🕯️",
    name: "The Confessor",
    text: "A long-trusted minister has served you faithfully but now grows old and cautious, resisting every bold move you wish to make.",
    left:  { label: "Keep the loyal servant", effects: { authority: -6, army: -4, people: +4, treasury: +2 } },
    right: { label: "Replace him with vigor", effects: { authority: +8, army: +6, people: -4, treasury: -4 } },
    lesson: "The choice of ministers is no light matter, for they are the first measure of a prince's brain. A good minister thinks always of the prince, never of himself — but a prince must also bend with the times, lest yesterday's faithful servant become tomorrow's dead weight."
  }
];

