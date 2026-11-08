// Game constants and mock data

export const CATEGORIES = [
  { id: 'hip-hop', name: 'Hip-Hop', icon: '🎤' },
  { id: 'movies', name: 'Movies', icon: '🎬' },
  { id: 'tv', name: 'TV', icon: '📺' },
  { id: 'rnb', name: "R'n'B", icon: '🎵' },
] as const;

// requiredCorrect = total correct answers needed to enter the level.
// Must stay in sync with public.compute_level on the server.
export const LEVELS = [
  { level: 0, name: 'Base', requiredCorrect: 0 },
  { level: 1, name: 'Gold', requiredCorrect: 10 },
  { level: 2, name: 'Platinum', requiredCorrect: 15 },
  { level: 3, name: 'Multi-Platinum', requiredCorrect: 20 },
  { level: 4, name: 'Diamond', requiredCorrect: 25 },
] as const;

export const TIMER_DURATION = 10; // seconds
export const DEFAULT_MICROPHONES = 3;

export const MICROPHONE_PACKS = [
  { count: 3, price: 0.99 },
  { count: 5, price: 1.49 },
  { count: 10, price: 2.49 },
] as const;

export type Category = typeof CATEGORIES[number]['id'];
export type LevelName = typeof LEVELS[number]['name'];

export const getLevelInfo = (level: number) => {
  return LEVELS[level] || LEVELS[0];
};

export const getLevelColor = (level: number): string => {
  const colors = [
    'text-level-base',
    'text-level-gold',
    'text-level-platinum',
    'text-level-multi-platinum',
    'text-level-diamond',
  ];
  return colors[level] || colors[0];
};

export const getLevelBgColor = (level: number): string => {
  const colors = [
    'bg-level-base',
    'bg-level-gold',
    'bg-level-platinum',
    'bg-level-multi-platinum',
    'bg-level-diamond',
  ];
  return colors[level] || colors[0];
};

// Mock questions database
export const MOCK_QUESTIONS: Record<string, Array<{
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  level: number;
}>> = {
  'hip-hop': [
    { id: 'hh1', question: 'Which rapper released the album "The Chronic" in 1992?', options: ['Snoop Dogg', 'Dr. Dre', 'Ice Cube', 'Tupac'], correctAnswer: 1, level: 0 },
    { id: 'hh2', question: 'What year did Run-DMC release "Walk This Way" with Aerosmith?', options: ['1984', '1985', '1986', '1987'], correctAnswer: 2, level: 0 },
    { id: 'hh3', question: 'Which rapper is known as "Slim Shady"?', options: ['50 Cent', 'Eminem', 'Dr. Dre', 'Jay-Z'], correctAnswer: 1, level: 0 },
    { id: 'hh4', question: 'What is Jay-Z\'s real name?', options: ['Shawn Carter', 'Andre Young', 'Calvin Broadus', 'Curtis Jackson'], correctAnswer: 0, level: 0 },
    { id: 'hh5', question: 'Which group had the hit "C.R.E.A.M."?', options: ['NWA', 'Wu-Tang Clan', 'Public Enemy', 'A Tribe Called Quest'], correctAnswer: 1, level: 0 },
    { id: 'hh6', question: 'Who founded Death Row Records?', options: ['Dr. Dre', 'Suge Knight', 'Eazy-E', 'Tupac'], correctAnswer: 1, level: 1 },
    { id: 'hh7', question: 'What was Notorious B.I.G.\'s debut album?', options: ['Life After Death', 'Ready to Die', 'Born Again', 'Duets'], correctAnswer: 1, level: 1 },
    { id: 'hh8', question: 'Which rapper started the Yeezy brand?', options: ['Drake', 'Kanye West', 'Travis Scott', 'J. Cole'], correctAnswer: 1, level: 1 },
    { id: 'hh9', question: 'What city is Outkast from?', options: ['New York', 'Los Angeles', 'Atlanta', 'Chicago'], correctAnswer: 2, level: 1 },
    { id: 'hh10', question: 'Who produced "In Da Club" by 50 Cent?', options: ['Timbaland', 'Dr. Dre', 'Pharrell', 'Kanye West'], correctAnswer: 1, level: 1 },
    { id: 'hh11', question: 'What was Tupac\'s final studio album released before his death?', options: ['Me Against the World', 'All Eyez on Me', 'Makaveli', 'Until the End of Time'], correctAnswer: 2, level: 2 },
    { id: 'hh12', question: 'Which rapper co-founded Roc-A-Fella Records?', options: ['Nas', 'Jay-Z', 'DMX', 'LL Cool J'], correctAnswer: 1, level: 2 },
    { id: 'hh13', question: 'What is the name of Kendrick Lamar\'s 2015 album?', options: ['DAMN.', 'Good Kid M.A.A.D City', 'To Pimp a Butterfly', 'Section.80'], correctAnswer: 2, level: 2 },
    { id: 'hh14', question: 'Which female rapper had the hit "Bodak Yellow"?', options: ['Nicki Minaj', 'Cardi B', 'Megan Thee Stallion', 'Doja Cat'], correctAnswer: 1, level: 2 },
    { id: 'hh15', question: 'What group was Ice Cube originally part of?', options: ['Wu-Tang Clan', 'NWA', 'Public Enemy', 'Run-DMC'], correctAnswer: 1, level: 2 },
    { id: 'hh16', question: 'Which rapper has a daughter named Blue Ivy?', options: ['Kanye West', 'Drake', 'Jay-Z', 'Nas'], correctAnswer: 2, level: 3 },
    { id: 'hh17', question: 'What was the first hip-hop song to reach #1 on the Billboard Hot 100?', options: ['Rapper\'s Delight', 'Walk This Way', 'Ice Ice Baby', 'U Can\'t Touch This'], correctAnswer: 2, level: 3 },
    { id: 'hh18', question: 'Which rapper is from Compton and released "m.A.A.d city"?', options: ['Dr. Dre', 'Kendrick Lamar', 'YG', 'The Game'], correctAnswer: 1, level: 3 },
    { id: 'hh19', question: 'What year was "The Blueprint" by Jay-Z released?', options: ['1999', '2000', '2001', '2002'], correctAnswer: 2, level: 3 },
    { id: 'hh20', question: 'Which rapper founded the label Top Dawg Entertainment?', options: ['Dr. Dre', 'J. Cole', 'Anthony Tiffith', 'Kendrick Lamar'], correctAnswer: 2, level: 3 },
    { id: 'hh21', question: 'What was the first rap group to be inducted into the Rock and Roll Hall of Fame?', options: ['Run-DMC', 'Grandmaster Flash', 'NWA', 'Public Enemy'], correctAnswer: 1, level: 4 },
    { id: 'hh22', question: 'Which producer is known for the "chipmunk soul" style?', options: ['Dr. Dre', 'Kanye West', 'Timbaland', 'J Dilla'], correctAnswer: 1, level: 4 },
    { id: 'hh23', question: 'What year did Tupac Shakur pass away?', options: ['1994', '1995', '1996', '1997'], correctAnswer: 2, level: 4 },
    { id: 'hh24', question: 'Which rapper won the first Grammy for Best Rap Album?', options: ['LL Cool J', 'DJ Jazzy Jeff & The Fresh Prince', 'MC Hammer', 'Run-DMC'], correctAnswer: 1, level: 4 },
    { id: 'hh25', question: 'What is Snoop Dogg\'s real name?', options: ['Calvin Broadus', 'Andre Young', 'Shawn Carter', 'Marshall Mathers'], correctAnswer: 0, level: 4 },
  ],
  'movies': [
    { id: 'mv1', question: 'Who directed "Pulp Fiction"?', options: ['Martin Scorsese', 'Quentin Tarantino', 'Steven Spielberg', 'Christopher Nolan'], correctAnswer: 1, level: 0 },
    { id: 'mv2', question: 'What year was "The Godfather" released?', options: ['1970', '1971', '1972', '1973'], correctAnswer: 2, level: 0 },
    { id: 'mv3', question: 'Who played the Joker in "The Dark Knight"?', options: ['Jack Nicholson', 'Heath Ledger', 'Jared Leto', 'Joaquin Phoenix'], correctAnswer: 1, level: 0 },
    { id: 'mv4', question: 'Which film won Best Picture at the 2020 Oscars?', options: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'], correctAnswer: 2, level: 0 },
    { id: 'mv5', question: 'What is the highest-grossing film of all time?', options: ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: The Force Awakens'], correctAnswer: 1, level: 0 },
    { id: 'mv6', question: 'Who directed "Inception"?', options: ['Christopher Nolan', 'Denis Villeneuve', 'Ridley Scott', 'James Cameron'], correctAnswer: 0, level: 1 },
    { id: 'mv7', question: 'Which actor plays John Wick?', options: ['Tom Cruise', 'Keanu Reeves', 'Liam Neeson', 'Jason Statham'], correctAnswer: 1, level: 1 },
    { id: 'mv8', question: 'What is the name of the AI in "2001: A Space Odyssey"?', options: ['WALL-E', 'HAL 9000', 'Skynet', 'JARVIS'], correctAnswer: 1, level: 1 },
    { id: 'mv9', question: 'Who directed "Get Out"?', options: ['Spike Lee', 'Jordan Peele', 'Barry Jenkins', 'Ryan Coogler'], correctAnswer: 1, level: 1 },
    { id: 'mv10', question: 'Which movie features the line "I\'ll be back"?', options: ['Predator', 'Terminator', 'Total Recall', 'Commando'], correctAnswer: 1, level: 1 },
    { id: 'mv11', question: 'Who played Tony Stark in the MCU?', options: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], correctAnswer: 2, level: 2 },
    { id: 'mv12', question: 'What was the first Pixar feature film?', options: ['A Bug\'s Life', 'Toy Story', 'Finding Nemo', 'Monsters, Inc.'], correctAnswer: 1, level: 2 },
    { id: 'mv13', question: 'Who directed "The Shawshank Redemption"?', options: ['Frank Darabont', 'Martin Scorsese', 'David Fincher', 'Clint Eastwood'], correctAnswer: 0, level: 2 },
    { id: 'mv14', question: 'Which film features a character named Tyler Durden?', options: ['American Psycho', 'Fight Club', 'Se7en', 'Gone Girl'], correctAnswer: 1, level: 2 },
    { id: 'mv15', question: 'Who composed the music for "The Lion King"?', options: ['John Williams', 'Hans Zimmer', 'James Horner', 'Howard Shore'], correctAnswer: 1, level: 2 },
    { id: 'mv16', question: 'In "The Matrix", what color pill does Neo take?', options: ['Blue', 'Red', 'Green', 'Yellow'], correctAnswer: 1, level: 3 },
    { id: 'mv17', question: 'Who directed "Schindler\'s List"?', options: ['Roman Polanski', 'Steven Spielberg', 'Francis Ford Coppola', 'Stanley Kubrick'], correctAnswer: 1, level: 3 },
    { id: 'mv18', question: 'What is Rosebud in "Citizen Kane"?', options: ['A flower', 'A sled', 'A person', 'A horse'], correctAnswer: 1, level: 3 },
    { id: 'mv19', question: 'Which actor has won the most Oscars?', options: ['Meryl Streep', 'Katharine Hepburn', 'Jack Nicholson', 'Daniel Day-Lewis'], correctAnswer: 1, level: 3 },
    { id: 'mv20', question: 'Who directed "Goodfellas"?', options: ['Brian De Palma', 'Martin Scorsese', 'Francis Ford Coppola', 'Quentin Tarantino'], correctAnswer: 1, level: 3 },
    { id: 'mv21', question: 'What year was "Casablanca" released?', options: ['1940', '1941', '1942', '1943'], correctAnswer: 2, level: 4 },
    { id: 'mv22', question: 'Who won the first Academy Award for Best Actress?', options: ['Mary Pickford', 'Janet Gaynor', 'Greta Garbo', 'Gloria Swanson'], correctAnswer: 1, level: 4 },
    { id: 'mv23', question: 'Which film has won the most Academy Awards?', options: ['The Lord of the Rings: The Return of the King', 'Ben-Hur', 'Titanic', 'All three are tied'], correctAnswer: 3, level: 4 },
    { id: 'mv24', question: 'Who directed "Vertigo"?', options: ['Billy Wilder', 'Alfred Hitchcock', 'Orson Welles', 'John Ford'], correctAnswer: 1, level: 4 },
    { id: 'mv25', question: 'What was the first film to gross over $1 billion?', options: ['Titanic', 'Jurassic Park', 'Star Wars', 'The Phantom Menace'], correctAnswer: 0, level: 4 },
  ],
  'tv': [
    { id: 'tv1', question: 'What is the longest-running animated series in the US?', options: ['Family Guy', 'South Park', 'The Simpsons', 'SpongeBob SquarePants'], correctAnswer: 2, level: 0 },
    { id: 'tv2', question: 'Who plays Walter White in "Breaking Bad"?', options: ['Aaron Paul', 'Bryan Cranston', 'Bob Odenkirk', 'Jonathan Banks'], correctAnswer: 1, level: 0 },
    { id: 'tv3', question: 'What city is "Friends" set in?', options: ['Los Angeles', 'Chicago', 'New York', 'Boston'], correctAnswer: 2, level: 0 },
    { id: 'tv4', question: 'Which show features a coffee shop called Central Perk?', options: ['Seinfeld', 'Friends', 'How I Met Your Mother', 'Frasier'], correctAnswer: 1, level: 0 },
    { id: 'tv5', question: 'Who is the creator of "The Office" (US)?', options: ['Ricky Gervais', 'Greg Daniels', 'Michael Schur', 'Dan Goor'], correctAnswer: 1, level: 0 },
    { id: 'tv6', question: 'What is the Iron Throne made of in "Game of Thrones"?', options: ['Iron', 'Steel', 'Swords', 'Bronze'], correctAnswer: 2, level: 1 },
    { id: 'tv7', question: 'Who plays the lead in "Stranger Things"?', options: ['Millie Bobby Brown', 'Finn Wolfhard', 'Gaten Matarazzo', 'Caleb McLaughlin'], correctAnswer: 0, level: 1 },
    { id: 'tv8', question: 'Which show is set in Hawkins, Indiana?', options: ['Dark', 'Stranger Things', 'Supernatural', 'The X-Files'], correctAnswer: 1, level: 1 },
    { id: 'tv9', question: 'What year did "The Sopranos" first air?', options: ['1997', '1998', '1999', '2000'], correctAnswer: 2, level: 1 },
    { id: 'tv10', question: 'Who plays Daenerys Targaryen?', options: ['Sophie Turner', 'Maisie Williams', 'Emilia Clarke', 'Lena Headey'], correctAnswer: 2, level: 1 },
    { id: 'tv11', question: 'Which streaming service produced "House of Cards"?', options: ['Hulu', 'Amazon Prime', 'Netflix', 'HBO Max'], correctAnswer: 2, level: 2 },
    { id: 'tv12', question: 'What is the name of the bar in "Cheers"?', options: ['Cheers', 'McLaren\'s', 'Paddy\'s Pub', 'Moe\'s Tavern'], correctAnswer: 0, level: 2 },
    { id: 'tv13', question: 'Who plays the title character in "Sherlock"?', options: ['Robert Downey Jr.', 'Benedict Cumberbatch', 'Jonny Lee Miller', 'Henry Cavill'], correctAnswer: 1, level: 2 },
    { id: 'tv14', question: 'What network originally aired "Mad Men"?', options: ['HBO', 'Showtime', 'AMC', 'FX'], correctAnswer: 2, level: 2 },
    { id: 'tv15', question: 'Who created "Black Mirror"?', options: ['Charlie Brooker', 'Vince Gilligan', 'David Benioff', 'Shonda Rhimes'], correctAnswer: 0, level: 2 },
    { id: 'tv16', question: 'What is the highest-rated TV episode on IMDb?', options: ['The Rains of Castamere', 'Ozymandias', 'Battle of the Bastards', 'Pine Barrens'], correctAnswer: 1, level: 3 },
    { id: 'tv17', question: 'Which show has the most Emmy wins?', options: ['Game of Thrones', 'Saturday Night Live', 'Frasier', 'The Simpsons'], correctAnswer: 0, level: 3 },
    { id: 'tv18', question: 'Who plays Tyrion Lannister?', options: ['Nikolaj Coster-Waldau', 'Peter Dinklage', 'Kit Harington', 'Richard Madden'], correctAnswer: 1, level: 3 },
    { id: 'tv19', question: 'What year did "Lost" premiere?', options: ['2002', '2003', '2004', '2005'], correctAnswer: 2, level: 3 },
    { id: 'tv20', question: 'Which show is known for the "Red Wedding"?', options: ['Vikings', 'Game of Thrones', 'The Witcher', 'Rome'], correctAnswer: 1, level: 3 },
    { id: 'tv21', question: 'What was the first show to air on HBO?', options: ['The Sopranos', 'Oz', 'Sex and the City', 'Sometimes a Great Notion'], correctAnswer: 3, level: 4 },
    { id: 'tv22', question: 'Who wrote the theme song for "The Fresh Prince of Bel-Air"?', options: ['Will Smith', 'DJ Jazzy Jeff', 'Quincy Jones', 'All of the above'], correctAnswer: 3, level: 4 },
    { id: 'tv23', question: 'What is the name of the spaceship in "Firefly"?', options: ['Enterprise', 'Millennium Falcon', 'Serenity', 'Galactica'], correctAnswer: 2, level: 4 },
    { id: 'tv24', question: 'Which show holds the record for most viewers for a series finale?', options: ['Friends', 'Seinfeld', 'M*A*S*H', 'The Big Bang Theory'], correctAnswer: 2, level: 4 },
    { id: 'tv25', question: 'What year did "Twin Peaks" originally premiere?', options: ['1988', '1989', '1990', '1991'], correctAnswer: 2, level: 4 },
  ],
  'rnb': [
    { id: 'rb1', question: 'Who is known as the "Queen of Soul"?', options: ['Whitney Houston', 'Aretha Franklin', 'Diana Ross', 'Tina Turner'], correctAnswer: 1, level: 0 },
    { id: 'rb2', question: 'Which artist released "Thriller"?', options: ['Prince', 'Michael Jackson', 'Stevie Wonder', 'Marvin Gaye'], correctAnswer: 1, level: 0 },
    { id: 'rb3', question: 'What group was Beyoncé originally part of?', options: ['TLC', 'Destiny\'s Child', 'En Vogue', 'SWV'], correctAnswer: 1, level: 0 },
    { id: 'rb4', question: 'Who sang "I Will Always Love You" in "The Bodyguard"?', options: ['Mariah Carey', 'Celine Dion', 'Whitney Houston', 'Toni Braxton'], correctAnswer: 2, level: 0 },
    { id: 'rb5', question: 'Which artist is known as "The Weeknd"?', options: ['Abel Tesfaye', 'Bruno Mars', 'Frank Ocean', 'Chris Brown'], correctAnswer: 0, level: 0 },
    { id: 'rb6', question: 'What was Usher\'s breakthrough album?', options: ['Confessions', 'My Way', '8701', 'Raymond v. Raymond'], correctAnswer: 0, level: 1 },
    { id: 'rb7', question: 'Who released the album "Baduizm"?', options: ['Lauryn Hill', 'Erykah Badu', 'Jill Scott', 'Angie Stone'], correctAnswer: 1, level: 1 },
    { id: 'rb8', question: 'Which artist had a hit with "No Scrubs"?', options: ['Destiny\'s Child', 'TLC', 'En Vogue', 'SWV'], correctAnswer: 1, level: 1 },
    { id: 'rb9', question: 'Who is known as the "King of Pop"?', options: ['Prince', 'Michael Jackson', 'James Brown', 'Stevie Wonder'], correctAnswer: 1, level: 1 },
    { id: 'rb10', question: 'What year was "Purple Rain" released?', options: ['1982', '1983', '1984', '1985'], correctAnswer: 2, level: 1 },
    { id: 'rb11', question: 'Who produced "Lemonade"?', options: ['Pharrell', 'Beyoncé', 'Jay-Z', 'Multiple producers'], correctAnswer: 3, level: 2 },
    { id: 'rb12', question: 'Which artist released "Channel Orange"?', options: ['The Weeknd', 'Frank Ocean', 'Anderson .Paak', 'Miguel'], correctAnswer: 1, level: 2 },
    { id: 'rb13', question: 'What was Aaliyah\'s last album?', options: ['One in a Million', 'Aaliyah', 'Age Ain\'t Nothing But a Number', 'I Care 4 U'], correctAnswer: 1, level: 2 },
    { id: 'rb14', question: 'Who wrote "I\'m Every Woman" originally?', options: ['Whitney Houston', 'Chaka Khan', 'Valerie Simpson', 'Nickolas Ashford'], correctAnswer: 3, level: 2 },
    { id: 'rb15', question: 'Which label did Motown Records become famous for?', options: ['Soul', 'R&B', 'Funk', 'All of the above'], correctAnswer: 3, level: 2 },
    { id: 'rb16', question: 'Who sang "A Change Is Gonna Come"?', options: ['Marvin Gaye', 'Sam Cooke', 'Otis Redding', 'Ray Charles'], correctAnswer: 1, level: 3 },
    { id: 'rb17', question: 'What was the first R&B song to top the Billboard Hot 100?', options: ['What\'d I Say', 'Please Mr. Postman', 'Respect', 'My Girl'], correctAnswer: 1, level: 3 },
    { id: 'rb18', question: 'Who founded Motown Records?', options: ['Quincy Jones', 'Berry Gordy', 'Smokey Robinson', 'Marvin Gaye'], correctAnswer: 1, level: 3 },
    { id: 'rb19', question: 'Which artist has won the most Grammy Awards?', options: ['Beyoncé', 'Quincy Jones', 'Stevie Wonder', 'Alison Krauss'], correctAnswer: 0, level: 3 },
    { id: 'rb20', question: 'What year did "What\'s Going On" by Marvin Gaye release?', options: ['1969', '1970', '1971', '1972'], correctAnswer: 2, level: 3 },
    { id: 'rb21', question: 'Who was the first R&B artist to have a #1 pop single?', options: ['Nat King Cole', 'Fats Domino', 'The Platters', 'Chuck Berry'], correctAnswer: 2, level: 4 },
    { id: 'rb22', question: 'What record label was Aaliyah signed to when she passed?', options: ['Jive', 'Blackground', 'Virgin', 'Atlantic'], correctAnswer: 1, level: 4 },
    { id: 'rb23', question: 'Who originally recorded "Respect" before Aretha Franklin?', options: ['Sam Cooke', 'James Brown', 'Otis Redding', 'Ray Charles'], correctAnswer: 2, level: 4 },
    { id: 'rb24', question: 'What was the first music video to air on MTV?', options: ['Billie Jean', 'Video Killed the Radio Star', 'Thriller', 'Like a Virgin'], correctAnswer: 1, level: 4 },
    { id: 'rb25', question: 'Who is known as the "Godfather of Soul"?', options: ['Ray Charles', 'James Brown', 'Marvin Gaye', 'Sam Cooke'], correctAnswer: 1, level: 4 },
  ],
};

// Get questions for a specific category and level
export const getQuestionsForLevel = (category: Category, level: number) => {
  const categoryQuestions = MOCK_QUESTIONS[category] || [];
  return categoryQuestions.filter(q => q.level === level);
};

// Get all questions for a category up to a certain level
export const getQuestionsUpToLevel = (category: Category, level: number) => {
  const categoryQuestions = MOCK_QUESTIONS[category] || [];
  return categoryQuestions.filter(q => q.level <= level);
};

// Shuffle array utility
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
