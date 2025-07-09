import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestMode, Language } from '../types';

const Home: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<TestMode>(TestMode.THIRTY_SECONDS);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [isTestActive, setIsTestActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for window resize and keyboard events
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Start test when user presses any key (except special keys)
      if (!isTestActive && !isTestComplete && 
          !e.ctrlKey && !e.altKey && !e.metaKey && 
          e.key !== 'Tab' && e.key !== 'Escape' && e.key !== 'F1' && 
          e.key !== 'F2' && e.key !== 'F3' && e.key !== 'F4' && 
          e.key !== 'F5' && e.key !== 'F6' && e.key !== 'F7' && 
          e.key !== 'F8' && e.key !== 'F9' && e.key !== 'F10' && 
          e.key !== 'F11' && e.key !== 'F12') {
        // Focus on the textarea to start typing
        textAreaRef.current?.focus();
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTestActive, isTestComplete]);

  // Sample texts for different languages - Multiple paragraphs for variety
  const sampleTexts = useCallback(() => ({
    english: [
      "The art of communication has evolved dramatically throughout human history, transforming from simple gestures and sounds into sophisticated systems of written and spoken language. In today's digital age, the ability to type quickly and accurately has become an essential skill for personal and professional success. Whether you're writing emails, creating documents, programming software, or engaging in online conversations, your typing speed and accuracy directly impact your productivity and effectiveness. The development of muscle memory through consistent practice allows your fingers to move automatically across the keyboard, reducing the cognitive load required for typing and freeing your mind to focus on the content and ideas you want to express. Modern typing techniques emphasize proper posture, correct finger placement, and smooth, rhythmic keystrokes that minimize fatigue and maximize efficiency.",
      "Technology has revolutionized the way we work, learn, and connect with others across the globe. From artificial intelligence and machine learning to virtual reality and blockchain, innovative solutions are reshaping industries and creating new opportunities for growth and collaboration. The rapid pace of technological advancement requires continuous learning and adaptation, as professionals must stay current with emerging trends and tools. Digital literacy has become as fundamental as traditional reading and writing skills, enabling individuals to navigate complex information systems and participate fully in the modern economy. Social media platforms, cloud computing services, and mobile applications have transformed how we share information, conduct business, and maintain relationships.",
      "The natural world offers countless lessons about resilience, adaptation, and interconnectedness that can inspire and guide human behavior. Ecosystems demonstrate remarkable balance and efficiency, with each species playing a crucial role in maintaining environmental stability. Climate change and environmental degradation pose significant challenges that require collective action and innovative solutions from governments, businesses, and individuals. Sustainable practices, renewable energy sources, and conservation efforts are essential for preserving biodiversity and ensuring a healthy planet for future generations. Scientific research continues to reveal the intricate relationships between organisms and their environments, highlighting the importance of protecting natural habitats and reducing human impact on delicate ecological systems.",
      "Education serves as the foundation for personal growth, critical thinking, and societal progress, empowering individuals to reach their full potential and contribute meaningfully to their communities. The traditional classroom model is evolving to incorporate online learning, interactive technologies, and personalized instruction that accommodates diverse learning styles and schedules. Lifelong learning has become increasingly important as career paths become more dynamic and skills requirements change rapidly in response to technological and economic shifts. Educators are exploring innovative teaching methods, collaborative projects, and real-world applications to engage students and prepare them for success in an interconnected global society.",
      "The power of creativity and imagination drives innovation, artistic expression, and problem-solving across all aspects of human endeavor. Whether through literature, music, visual arts, or scientific discovery, creative thinking challenges conventional wisdom and opens new possibilities for understanding and improving the world around us. Collaborative creativity, where diverse perspectives and expertise combine to generate novel solutions, has proven particularly effective in addressing complex challenges that require multidisciplinary approaches. The creative process involves risk-taking, experimentation, and the willingness to learn from failure, qualities that are essential for personal and professional development in an uncertain and rapidly changing environment."
    ],
    french: [
      "L'évolution de la technologie moderne a transformé notre façon de communiquer, de travailler et d'interagir avec le monde qui nous entoure. Dans cette ère numérique, la maîtrise du clavier est devenue une compétence fondamentale qui influence directement notre productivité et notre efficacité professionnelle. La France, avec sa riche tradition littéraire et culturelle, a toujours valorisé l'expression écrite comme un art noble et raffiné. Aujourd'hui, cette tradition se prolonge dans le domaine numérique, où la capacité à taper rapidement et précisément en français constitue un atout considérable pour les étudiants, les professionnels et les créateurs de contenu. Les particularités de la langue française, avec ses accents, ses cédilles et ses caractères spéciaux, exigent une attention particulière lors de l'apprentissage de la dactylographie.",
      "La culture française rayonne dans le monde entier à travers sa gastronomie, son art, sa littérature et son cinéma, créant des liens durables entre les peuples et enrichissant le patrimoine mondial de l'humanité. Les chefs français ont révolutionné l'art culinaire en développant des techniques sophistiquées et en valorisant la qualité des ingrédients locaux et saisonniers. Les musées français, notamment le Louvre, Orsay et le Centre Pompidou, abritent des collections exceptionnelles qui attirent des millions de visiteurs chaque année et contribuent au rayonnement culturel du pays. La langue française, parlée sur cinq continents, demeure un vecteur privilégié d'échanges diplomatiques, scientifiques et artistiques entre les nations francophones.",
      "L'innovation technologique française se distingue par son approche humaniste et son engagement envers le développement durable, plaçant l'éthique et la responsabilité sociale au cœur des avancées scientifiques. Les startups françaises excellent dans des domaines variés comme l'intelligence artificielle, la biotechnologie, l'énergie renouvelable et la mobilité urbaine. Le système éducatif français forme des ingénieurs et des chercheurs reconnus internationalement pour leur rigueur méthodologique et leur capacité d'innovation. Les pôles de compétitivité régionaux favorisent la collaboration entre universités, centres de recherche et entreprises, créant un écosystème propice à l'émergence de solutions innovantes pour relever les défis contemporains.",
      "L'histoire de France témoigne d'une longue tradition de résistance, de révolution et de progrès social qui continue d'inspirer les mouvements démocratiques dans le monde entier. Les idéaux de liberté, d'égalité et de fraternité proclamés lors de la Révolution française restent des références universelles pour les sociétés en quête de justice et de dignité humaine. Le système de protection sociale français, avec ses prestations familiales, son assurance maladie universelle et ses retraites solidaires, constitue un modèle envié qui concilie efficacité économique et cohésion sociale. La laïcité à la française offre un cadre unique pour garantir la liberté de conscience tout en préservant l'unité républicaine dans le respect de la diversité des convictions.",
      "L'art de vivre français privilégie l'équilibre entre travail et loisirs, accordant une importance particulière aux plaisirs simples de l'existence comme les repas partagés, les promenades dans la nature et les conversations enrichissantes. Cette philosophie de vie valorise la qualité plutôt que la quantité, encourageant une approche réfléchie de la consommation et des relations humaines. Les marchés français, avec leurs produits locaux et leurs producteurs passionnés, incarnent cette quête d'authenticité et de proximité qui caractérise l'identité française. La préservation du patrimoine architectural et naturel reflète l'attachement profond des Français à leur histoire et à leur environnement, transmettant aux générations futures un héritage d'une richesse exceptionnelle."
    ]
  }), []);

  // Get random text for the selected language
  const getRandomText = useCallback((language: Language): string => {
    const texts = sampleTexts()[language];
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
  }, [sampleTexts]);

  // Get test duration
  const getTestDuration = useCallback((mode: TestMode): number => {
    switch (mode) {
      case TestMode.FIFTEEN_SECONDS: return 15;
      case TestMode.THIRTY_SECONDS: return 30;
      case TestMode.SIXTY_SECONDS: return 60;
      case TestMode.ONE_TWENTY_SECONDS: return 120;
      default: return 30;
    }
  }, []);

  // State for current display text
  const [displayText, setDisplayText] = useState('');

  // Initialize with random text on component mount (page load)
  useEffect(() => {
    setDisplayText(getRandomText(selectedLanguage));
  }, [getRandomText, selectedLanguage]);

  // Generate new random text when language changes
  useEffect(() => {
    setDisplayText(getRandomText(selectedLanguage));
    // Reset test when language changes
    setIsTestActive(false);
    setIsTestComplete(false);
    setUserInput('');
    setCurrentIndex(0);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
    setTotalChars(0);
    setStartTime(null);
    setTimeLeft(getTestDuration(selectedMode));
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [selectedLanguage, getRandomText, selectedMode, getTestDuration]);

  // Start test
  const startTest = () => {
    if (!isTestActive && !isTestComplete) {
      setIsTestActive(true);
      setStartTime(new Date());
      setTimeLeft(getTestDuration(selectedMode));
      
      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTestActive(false);
            setIsTestComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Reset test
  const resetTest = () => {
    setIsTestActive(false);
    setIsTestComplete(false);
    setUserInput('');
    setCurrentIndex(0);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
    setTotalChars(0);
    setStartTime(null);
    setTimeLeft(getTestDuration(selectedMode));
    
    // Select a new random text
    setDisplayText(getRandomText(selectedLanguage));
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Handle input
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (isTestComplete) return;
    
    const value = e.currentTarget.value;
    
    // Start test on first input
    if (!isTestActive && value.length > 0) {
      startTest();
    }
    
    // If user reached the end of text, complete the test
    if (value.length >= displayText.length) {
      setIsTestActive(false);
      setIsTestComplete(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    setUserInput(value);
    setCurrentIndex(value.length);
    
    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < value.length && i < displayText.length; i++) {
      if (value[i] === displayText[i]) {
        correct++;
      }
    }
    setCorrectChars(correct);
    setTotalChars(value.length);
    
    if (value.length > 0) {
      setAccuracy(Math.round((correct / value.length) * 100));
    }
  };

  // Calculate WPM
  useEffect(() => {
    if (isTestActive && startTime) {
      const timeElapsed = (Date.now() - startTime.getTime()) / 1000;
      if (timeElapsed > 0) {
        const wordsTyped = userInput.length / 5; // Standard: 5 characters = 1 word
        const currentWpm = Math.round((wordsTyped / timeElapsed) * 60);
        setWpm(currentWpm);
      }
    }
  }, [userInput, isTestActive, startTime]);

  // Reset when mode or language changes
  useEffect(() => {
    const resetTestFunction = () => {
      setIsTestActive(false);
      setIsTestComplete(false);
      setUserInput('');
      setCurrentIndex(0);
      setWpm(0);
      setAccuracy(100);
      setCorrectChars(0);
      setTotalChars(0);
      setStartTime(null);
      setTimeLeft(getTestDuration(selectedMode));
      
      // Select a new random text when language or mode changes
      setDisplayText(getRandomText(selectedLanguage));
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    
    resetTestFunction();
  }, [selectedMode, selectedLanguage, getRandomText, getTestDuration]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Generate character display - Word-based line breaking with proper spacing
  const getCharacterDisplay = () => {
    const maxLineLength = windowWidth < 576 ? 40 : windowWidth < 768 ? 55 : windowWidth < 1024 ? 70 : windowWidth < 1440 ? 85 : 100;
    
    // Split text into words and reconstruct with proper spacing
    const words = displayText.split(' ');
    const lines: string[] = [];
    let currentLine: string[] = [];
    let currentLineLength = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLength = word.length;
      
      // Check if adding this word would exceed line length
      if (currentLineLength + wordLength + (currentLine.length > 0 ? 1 : 0) > maxLineLength && currentLine.length > 0) {
        // Start a new line
        lines.push(currentLine.join(' '));
        currentLine = [word];
        currentLineLength = wordLength;
      } else {
        // Add word to current line
        currentLine.push(word);
        currentLineLength += wordLength + (currentLine.length > 1 ? 1 : 0);
      }
    }
    
    // Add the last line
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }
    
    // Find current line based on character position
    let currentLineIndex = 0;
    let charsSoFar = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + (i < lines.length - 1 ? 1 : 0); // +1 for line break space
      if (currentIndex >= charsSoFar && currentIndex < charsSoFar + lineLength) {
        currentLineIndex = i;
        break;
      }
      charsSoFar += lineLength;
    }
    
    // Show 3 lines starting from current line
    const visibleLines = [];
    for (let i = 0; i < 3; i++) {
      const lineIndex = currentLineIndex + i;
      if (lineIndex < lines.length) {
        visibleLines.push(lines[lineIndex]);
      } else {
        visibleLines.push(''); // Empty line
      }
    }
    
    return visibleLines.map((line, lineIndex) => {
      if (line === '') {
        return (
          <div key={`empty-${lineIndex}`} className="h-[2rem] flex items-center justify-center">
            <span className="text-transparent">.</span>
          </div>
        );
      }
      
      // Calculate the starting character index for this line
      let startIndex = 0;
      for (let i = 0; i < currentLineIndex + lineIndex; i++) {
        if (i < lines.length) {
          startIndex += lines[i].length + (i < lines.length - 1 ? 1 : 0);
        }
      }
      
      const lineElements = line.split('').map((char, charIndex) => {
        const globalIndex = startIndex + charIndex;
        let className = 'text-gray-400 dark:text-primary-300'; // Default untyped
        
        if (globalIndex < userInput.length) {
          if (userInput[globalIndex] === displayText[globalIndex]) {
            className = 'text-gray-900 dark:text-[#ffca8d]';
          } else {
            className = 'text-red-500 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
          }
        } else if (globalIndex === currentIndex && isTestActive) {
          className = 'bg-primary-600 text-white';
        }
        
        // Handle space characters specifically to make them visible
        if (char === ' ') {
          return (
            <span key={globalIndex} className={className}>
              {'\u00A0'} {/* Non-breaking space to make it visible */}
            </span>
          );
        }
        
        return (
          <span key={globalIndex} className={className}>
            {char}
          </span>
        );
      });
      
      return (
        <div key={lineIndex} className="h-[2rem] flex items-center justify-center whitespace-nowrap">
          {lineElements}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-primary-900 text-gray-900 dark:text-primary-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header - Clean and minimal */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary-700 dark:text-[#ffca8d] mb-4">
            TurboKeys
          </h1>
        </div>

        {/* Mode Selection - Clean and centered */}
        <div className="flex justify-center mb-16">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.values(TestMode).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSelectedMode(mode);
                    resetTest();
                  }}
                  className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-primary-800 text-gray-700 dark:text-primary-200 hover:bg-gray-300 dark:hover:bg-primary-700 hover:text-gray-900 dark:hover:text-primary-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {Object.values(Language).map((language) => (
                <button
                  key={language}
                  onClick={() => {
                    setSelectedLanguage(language);
                    resetTest();
                  }}
                  className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedLanguage === language
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-primary-800 text-gray-700 dark:text-primary-200 hover:bg-gray-300 dark:hover:bg-primary-700 hover:text-gray-900 dark:hover:text-primary-100'
                  }`}
                >
                  {language === 'french' ? 'Français' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Typing Test - Clean centered layout like MonkeyType */}
        <div className="mx-auto px-4">
          {/* Stats Display */}
          <div className="flex justify-center space-x-12 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-[#ffca8d]">{timeLeft}</div>
              <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-[#ffca8d]">{wpm}</div>
              <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-[#ffca8d]">{accuracy}%</div>
              <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">Accuracy</div>
            </div>
          </div>
          
          {/* Typing Area */}
          <div 
            className="relative cursor-text w-full overflow-hidden mb-8"
            style={{ height: '140px' }}
            onClick={() => textAreaRef.current?.focus()}
          >
            <div className={`text-xl md:text-2xl font-mono max-w-full mx-auto h-full flex flex-col justify-center gap-1 px-4 md:px-8 transition-all duration-300 ${!isTestActive && !isTestComplete ? 'blur-sm' : ''}`} style={{ whiteSpace: 'pre-wrap' }}>
              {getCharacterDisplay()}
            </div>
            
            {/* Invisible textarea for input */}
            <textarea
              ref={textAreaRef}
              value={userInput}
              onChange={handleInput}
              className="absolute inset-0 w-full h-full opacity-0 resize-none outline-none"
              disabled={isTestComplete}
              placeholder=""
            />
            
            {/* Focus overlay */}
            {!isTestActive && !isTestComplete && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-primary-400">
                  <p className="text-lg mb-1">Click here to start typing</p>
                  <p className="text-sm opacity-75">Selected: {selectedMode} • {selectedLanguage === 'french' ? 'Français' : 'English'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Test Complete Screen */}
          {isTestComplete && (
            <div className="text-center p-8 mb-6">
              <h2 className="text-2xl font-bold text-primary-600 dark:text-[#ffca8d] mb-6">Test Complete!</h2>
              <div className="grid grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 dark:text-[#ffca8d]">{wpm}</div>
                  <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{accuracy}%</div>
                  <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 dark:text-[#ffca8d]">{correctChars}/{totalChars}</div>
                  <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">Correct</div>
                </div>
              </div>
              <button 
                onClick={resetTest}
                className="bg-primary-600 text-white px-8 py-3 rounded font-medium hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!isTestActive && !isTestComplete && (
            <div className="text-center text-gray-500 dark:text-primary-400 mb-4">
              <p className="text-sm">Click on the text above to start typing</p>
            </div>
          )}
        </div>

        {/* Instructions - Clean and minimal */}
        <div className="max-w-4xl mx-auto mt-20 text-center">
          <div className="text-sm text-gray-500 dark:text-primary-400 space-y-2">
            <p>Click on the text area to start • Type the words exactly as shown • Use backspace to correct mistakes</p>
            <p>Your WPM and accuracy will be calculated in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
