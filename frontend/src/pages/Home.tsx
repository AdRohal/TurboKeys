import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TestMode, Language } from '../types';
import { typingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<TestMode>(TestMode.THIRTY_SECONDS);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [isTestActive, setIsTestActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // This should match the default mode
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number; raw: number; accuracy: number }[]>([]);
  const [errorHistory, setErrorHistory] = useState<{ time: number; errors: number }[]>([]);
  const [lastErrorCount, setLastErrorCount] = useState(0);
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTimerRunningRef = useRef<boolean>(false);
  const startTimeRef = useRef<Date | null>(null);
  const timerId = useRef<number>(Math.random()); // Unique ID for this component instance
  
  // Add refs to store current values for timer callbacks
  const totalCharsRef = useRef<number>(0);
  const correctCharsRef = useRef<number>(0);
  const wpmRef = useRef<number>(0);
  const accuracyRef = useRef<number>(100);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  // Initialize with random text on component mount (page load) and when language/mode changes
  useEffect(() => {
    const instanceId = timerId.current;
    console.log('Component mount or language/mode changed, resetting test for instance:', instanceId);
    const newTimeLeft = getTestDuration(selectedMode);
    console.log('Setting timeLeft to:', newTimeLeft, 'for mode:', selectedMode, 'instance:', instanceId);
    
    // Aggressively stop any running timer
    isTimerRunningRef.current = false;
    if (timerRef.current) {
      console.log('useEffect clearing timer:', timerRef.current, 'instance:', instanceId);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setDisplayText(getRandomText(selectedLanguage));
    setIsTestActive(false);
    setIsTestComplete(false);
    setUserInput('');
    setCurrentIndex(0);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
    setTotalChars(0);
    setStartTime(null);
    startTimeRef.current = null;
    setWpmHistory([]);
    setErrorHistory([]);
    setLastErrorCount(0);
    setTimeLeft(newTimeLeft);

    // Reset refs
    totalCharsRef.current = 0;
    correctCharsRef.current = 0;
    wpmRef.current = 0;
    accuracyRef.current = 100;

    // Return cleanup function
    return () => {
      console.log('Component unmounting, cleaning up instance:', instanceId);
      isTimerRunningRef.current = false;
      if (timerRef.current) {
        console.log('Cleanup clearing timer:', timerRef.current, 'instance:', instanceId);
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [getRandomText, selectedLanguage, selectedMode, getTestDuration]);

  // Start test
  const startTest = () => {
    // Check if already running to prevent multiple starts
    if (isTestActive || isTestComplete || isTimerRunningRef.current) {
      console.log('Cannot start test - already active or timer running:', {
        isTestActive, 
        isTestComplete, 
        timerRunning: isTimerRunningRef.current
      });
      return;
    }

    console.log('Starting test... Timer ID:', timerId.current);
    
    // Clear any existing timer absolutely
    if (timerRef.current) {
      console.log('Force clearing existing timer:', timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const newStartTime = new Date();
    const testDuration = getTestDuration(selectedMode);
    
    // Set all refs first before state
    isTimerRunningRef.current = true;
    startTimeRef.current = newStartTime;
    
    setIsTestActive(true);
    setStartTime(newStartTime);
    setTimeLeft(testDuration);
    
    console.log('Test started with duration:', testDuration, 'seconds');
    console.log('Start time set to:', newStartTime);
    
    // Create timer with strict guards
    let currentTime = testDuration;
    
    const intervalId = setInterval(() => {
      // Double check we should still be running
      if (!isTimerRunningRef.current) {
        console.log('Timer stopping - ref says not running');
        clearInterval(intervalId);
        return;
      }
      
      currentTime--;
      console.log('Timer tick, time left:', currentTime, 'instance:', timerId.current);
      
      // Update React state
      setTimeLeft(currentTime);
      
      if (currentTime <= 0) {
        console.log('Timer completed, calling completeTest');
        isTimerRunningRef.current = false;
        clearInterval(intervalId);
        completeTest();
        return;
      }
      
      // Record WPM data point every second - using a timeout to avoid React state issues
      setTimeout(() => recordWpmDataPoint(), 10);
    }, 1000);
    
    timerRef.current = intervalId;
    console.log('Timer started with ID:', intervalId, 'instance:', timerId.current);
  };

  // Reset test
  const resetTest = () => {
    console.log('resetTest called for instance:', timerId.current);
    
    // Aggressively stop timer
    isTimerRunningRef.current = false;
    if (timerRef.current) {
      console.log('resetTest clearing timer:', timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsTestActive(false);
    setIsTestComplete(false);
    setUserInput('');
    setCurrentIndex(0);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
    setTotalChars(0);
    setStartTime(null);
    startTimeRef.current = null;
    setWpmHistory([]);
    setErrorHistory([]);
    setLastErrorCount(0);
    
    // Reset refs
    totalCharsRef.current = 0;
    correctCharsRef.current = 0;
    wpmRef.current = 0;
    accuracyRef.current = 100;
    
    const newTimeLeft = getTestDuration(selectedMode);
    console.log('resetTest setting timeLeft to:', newTimeLeft, 'for mode:', selectedMode);
    setTimeLeft(newTimeLeft);
    
    // Select a new random text
    setDisplayText(getRandomText(selectedLanguage));
  };

  // Handle input
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (isTestComplete) return;
    
    const value = e.currentTarget.value;
    console.log('handleInput called with value length:', value.length, 'isTestActive:', isTestActive);
    
    // Check if this is a valid typing input (not just spaces or empty)
    const hasValidContent = value.trim().length > 0;
    
    // Update input and character counts first
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
    
    // Update refs for timer callbacks
    correctCharsRef.current = correct;
    totalCharsRef.current = value.length;
    
    console.log('Updated character counts - totalChars:', value.length, 'correctChars:', correct);
    
    if (value.length > 0) {
      const newAccuracy = Math.round((correct / value.length) * 100);
      setAccuracy(newAccuracy);
      accuracyRef.current = newAccuracy;
    } else {
      setAccuracy(100); // Reset to 100% when input is empty
      accuracyRef.current = 100;
    }
    
    // Start test only if we have valid content and the first character matches
    if (!isTestActive && hasValidContent && value.length > 0 && value[0] === displayText[0]) {
      console.log('Starting test due to valid first input');
      startTest();
    }
    
    // If user reached the end of text, complete the test
    if (value.length >= displayText.length) {
      console.log('Test completed: reached end of text');
      completeTest();
      return;
    }
    
    // Record data point for graph if test is active
    if (isTestActive && startTime) {
      recordWpmDataPoint();
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
        wpmRef.current = currentWpm;
      }
    }
  }, [userInput, isTestActive, startTime]);

  // Record WPM data point for graph
  const recordWpmDataPoint = useCallback(() => {
    if (!startTime || !isTestActive) return;
    
    const totalDuration = getTestDuration(selectedMode);
    const secondsElapsed = totalDuration - timeLeft;
    
    if (secondsElapsed > 0) {
      const currentWpm = totalChars > 0 ? Math.round((correctChars / 5) / (secondsElapsed / 60)) : 0;
      const rawWpm = totalChars > 0 ? Math.round((totalChars / 5) / (secondsElapsed / 60)) : 0;
      const currentAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
      const totalCurrentErrors = totalChars - correctChars;
      const newErrors = totalCurrentErrors - lastErrorCount;
      
      setWpmHistory(prev => [
        ...prev,
        {
          time: secondsElapsed,
          wpm: currentWpm,
          raw: rawWpm,
          accuracy: currentAccuracy
        }
      ]);
      
      setErrorHistory(prev => [
        ...prev,
        {
          time: secondsElapsed,
          errors: newErrors
        }
      ]);
      
      setLastErrorCount(totalCurrentErrors);
    }
  }, [startTime, isTestActive, timeLeft, totalChars, correctChars, selectedMode, getTestDuration, lastErrorCount]);

  // Cleanup
  useEffect(() => {
    return () => {
      isTimerRunningRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Generate character display - Word-based line breaking with proper spacing
  // Responsive for all screens, with even more granular breakpoints
  const getCharacterDisplay = () => {
    // Ultra-granular breakpoints for modern devices
    // < 320px: ultra small phones, < 340px: very small phones, < 360px: small phones, < 375px: iPhone SE, < 400px: small/old phones
    // < 430px: iPhone 14 Pro Max, < 480px: medium phones, < 540px: phablets, < 576px: large phones/phablets
    // < 640px: small tablets, < 720px: 7" tablets, < 768px: tablets, < 820px: iPad Mini, < 900px: large tablets
    // < 1024px: small laptops, < 1152px: Chromebook, < 1280px: desktops, < 1366px: common laptops, < 1440px: large desktops, else: ultra-wide
    const maxLineLength = windowWidth < 320 ? 18 // ultra small phones
      : windowWidth < 340 ? 20 // very small phones
      : windowWidth < 360 ? 22 // small phones
      : windowWidth < 375 ? 24 // iPhone SE
      : windowWidth < 400 ? 28 // small/old phones
      : windowWidth < 430 ? 30 // iPhone 14 Pro Max
      : windowWidth < 480 ? 32 // medium phones
      : windowWidth < 540 ? 36 // phablets
      : windowWidth < 576 ? 40 // large phones/phablets
      : windowWidth < 640 ? 48 // small tablets
      : windowWidth < 720 ? 52 // 7" tablets
      : windowWidth < 768 ? 55 // tablets
      : windowWidth < 820 ? 58 // iPad Mini
      : windowWidth < 900 ? 62 // large tablets
      : windowWidth < 1024 ? 70 // small laptops
      : windowWidth < 1152 ? 75 // Chromebook
      : windowWidth < 1280 ? 80 // desktops
      : windowWidth < 1366 ? 70 // common laptops
      : windowWidth < 1440 ? 75 // large desktops
      : 100; // ultra-wide screens
    
    // Split text into words and reconstruct with proper spacing
    const words = displayText.split(' ');
    const lines: string[] = [];
    let currentLine: string[] = [];
    let currentLineLengthCount = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLength = word.length;
      
      // Check if adding this word would exceed line length
      if (currentLineLengthCount + wordLength + (currentLine.length > 0 ? 1 : 0) > maxLineLength && currentLine.length > 0) {
        // Start a new line
        lines.push(currentLine.join(' '));
        currentLine = [word];
        currentLineLengthCount = wordLength;
      } else {
        // Add word to current line
        currentLine.push(word);
        currentLineLengthCount += wordLength + (currentLine.length > 1 ? 1 : 0);
      }
    }
    
    // Add the last line
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }
    
    // Find current line based on character position
    let currentLineIndex = 0;
    let charsSoFar = 0;
    let charsInCurrentLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + (i < lines.length - 1 ? 1 : 0); // +1 for line break space
      if (currentIndex >= charsSoFar && currentIndex < charsSoFar + lineLength) {
        currentLineIndex = i;
        charsInCurrentLine = currentIndex - charsSoFar;
        break;
      }
      charsSoFar += lineLength;
    }
    
    // Determine which lines to show based on position within current line
    let startLineIndex;
    const currentLineLength = lines[currentLineIndex]?.length || 0;
    const progressInLine = charsInCurrentLine / Math.max(currentLineLength, 1);
    
    if (progressInLine < 0.5) {
      // User is in first half of current line, show current line as second line
      startLineIndex = Math.max(0, currentLineIndex - 1);
    } else {
      // User is in second half of current line, show current line as first line
      startLineIndex = currentLineIndex;
    }
    
    // Show 3 lines starting from calculated start index
    const visibleLines = [];
    for (let i = 0; i < 3; i++) {
      const lineIndex = startLineIndex + i;
      if (lineIndex < lines.length) {
        visibleLines.push({ text: lines[lineIndex], originalIndex: lineIndex });
      } else {
        visibleLines.push({ text: '', originalIndex: -1 }); // Empty line
      }
    }
    
    return visibleLines.map((lineData, displayIndex) => {
      if (lineData.text === '') {
        return (
          <div key={`empty-${displayIndex}`} className="h-[2rem] flex items-center justify-center">
            <span className="text-transparent">.</span>
          </div>
        );
      }
      
      // Calculate the starting character index for this line
      let startIndex = 0;
      for (let i = 0; i < lineData.originalIndex; i++) {
        if (i < lines.length) {
          startIndex += lines[i].length + (i < lines.length - 1 ? 1 : 0);
        }
      }
      
      const lineElements = lineData.text.split('').map((char: string, charIndex: number) => {
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
        <div key={displayIndex} className="h-[2rem] flex items-center justify-center whitespace-nowrap">
          {lineElements}
        </div>
      );
    });
  };

  // Submit test result to backend with provided values
  const submitTestResultWithValues = useCallback(async (
    submitStartTime: Date,
    submitTotalChars: number, 
    submitWpm: number,
    submitAccuracy: number,
    submitCorrectChars: number
  ) => {
    console.log('submitTestResultWithValues called');
    console.log('User:', user);
    console.log('StartTime:', submitStartTime);
    console.log('Current state:', { 
      wpm: submitWpm, 
      accuracy: submitAccuracy, 
      totalChars: submitTotalChars, 
      correctChars: submitCorrectChars, 
      displayText: displayText.length 
    });
    
    if (!user) {
      console.log('Cannot submit test result: user not logged in');
      return;
    }

    if (!submitStartTime) {
      console.log('Cannot submit test result: test was never started (startTime is null)');
      return;
    }

    const testDuration = getTestDuration(selectedMode);
    const errorsCount = Math.max(0, submitTotalChars - submitCorrectChars);

    // Ensure we have valid data before submission - allow even minimal typing attempts
    if (submitTotalChars === 0) {
      console.log('Cannot submit test result: no characters typed', { totalChars: submitTotalChars, wpm: submitWpm });
      return;
    }

    const testData = {
      wpm: Math.round(submitWpm),
      accuracy: Math.round(submitAccuracy), // accuracy is already a percentage (0-100)
      duration: testDuration,
      mode: 'time', // Set as 'time' mode consistently
      language: selectedLanguage,
      difficulty: 'medium',
      charactersTyped: submitTotalChars,
      errorsCount: errorsCount,
      correctCharacters: submitCorrectChars,
      totalCharacters: displayText.length,
      testText: displayText.substring(0, Math.min(submitTotalChars, displayText.length)),
      text: displayText
    };

    console.log('Submitting test result:', testData);

    try {
      setIsSubmittingResult(true);
      const result = await typingAPI.submitTest(testData);
      console.log('Test result submitted successfully:', result);
      console.log('Result details:', result);
    } catch (error) {
      console.error('Failed to submit test result:', error);
      console.error('Error details:', error);
      // Show more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setIsSubmittingResult(false);
    }
  }, [user, getTestDuration, selectedMode, selectedLanguage, displayText]);

  // Complete test and submit results
  const completeTest = useCallback(async () => {
    // Prevent multiple calls to completeTest
    if (isTestComplete) {
      console.log('Test already completed, ignoring duplicate call');
      return;
    }
    
    // Stop timer first to prevent further calls
    isTimerRunningRef.current = false;
    if (timerRef.current) {
      console.log('Clearing timer:', timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Capture current values immediately to avoid stale closure issues
    // Use the refs for current values to ensure we have the actual latest values
    const currentStartTime = startTimeRef.current || startTime;
    const currentTotalChars = totalCharsRef.current;
    const currentWpm = wpmRef.current;
    const currentAccuracy = accuracyRef.current;
    const currentCorrectChars = correctCharsRef.current;
    
    console.log('Test completed! Final stats:', { 
      wpm: currentWpm, 
      accuracy: currentAccuracy, 
      totalChars: currentTotalChars, 
      correctChars: currentCorrectChars, 
      timeLeft,
      user: !!user,
      startTime: !!currentStartTime,
      startTimeValue: currentStartTime,
      startTimeFromRef: startTimeRef.current
    });
    
    setIsTestActive(false);
    setIsTestComplete(true);

    // Only submit result if user is logged in AND actually typed something
    if (user && currentStartTime && currentTotalChars > 0) {
      console.log('User is logged in and typed characters, submitting result...');
      // Use the captured values for submission
      await submitTestResultWithValues(currentStartTime, currentTotalChars, currentWpm, currentAccuracy, currentCorrectChars);
    } else {
      console.log('Not submitting result:', { 
        user: !!user, 
        startTime: !!currentStartTime, 
        totalChars: currentTotalChars 
      });
    }
  }, [isTestComplete, startTime, timeLeft, user, submitTestResultWithValues]);

  // Responsive font size for typing area (more granular)
  let fontSizeClass = 'text-xl';
  if (windowWidth < 320) fontSizeClass = 'text-[0.7rem]'; // ultra small phones
  else if (windowWidth < 340) fontSizeClass = 'text-xs'; // very small phones
  else if (windowWidth < 360) fontSizeClass = 'text-sm'; // small phones
  else if (windowWidth < 375) fontSizeClass = 'text-base'; // iPhone SE
  else if (windowWidth < 400) fontSizeClass = 'text-[1.05rem]'; // small/old phones
  else if (windowWidth < 430) fontSizeClass = 'text-[1.1rem]'; // iPhone 14 Pro Max
  else if (windowWidth < 480) fontSizeClass = 'text-lg'; // medium phones
  else if (windowWidth < 540) fontSizeClass = 'text-xl'; // phablets
  else if (windowWidth < 576) fontSizeClass = 'text-lg'; // large phones/phablets
  else if (windowWidth < 640) fontSizeClass = 'text-lg'; // small tablets
  else if (windowWidth < 720) fontSizeClass = 'text-lg'; // 7" tablets
  else if (windowWidth < 768) fontSizeClass = 'text-lg'; // tablets
  else if (windowWidth < 900) fontSizeClass = 'text-lg'; // large tablets
  else if (windowWidth < 1024) fontSizeClass = 'text-lg'; // small laptops
  else if (windowWidth < 1280) fontSizeClass = 'text-xl'; // desktops
  else if (windowWidth < 1440) fontSizeClass = 'text-1xl'; // large desktops
  else fontSizeClass = 'text-2xl';

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
        {!isTestActive && !isTestComplete && (
          <div className="flex justify-center mb-16">
            <div className="flex items-center space-x-6 px-6 py-3 bg-gray-100 dark:bg-primary-800 rounded-lg border border-gray-200 dark:border-primary-700">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-primary-400">⏱</span>
                <span className="text-sm font-medium text-primary-600 dark:text-[#ffca8d]">time</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600 dark:text-primary-400">⚠</span>
                <div className="flex space-x-1">
                  { [
                    { mode: TestMode.FIFTEEN_SECONDS, label: '15' },
                    { mode: TestMode.THIRTY_SECONDS, label: '30' },
                    { mode: TestMode.SIXTY_SECONDS, label: '60' },
                    { mode: TestMode.ONE_TWENTY_SECONDS, label: '120' }
                  ].map(({ mode, label }) => (
                    <button
                      key={mode}
                      onClick={() => {
                        if (!isTestActive && !isTestComplete) {
                          setSelectedMode(mode);
                          resetTest();
                        }
                      }}
                      disabled={isTestActive || isTestComplete}
                      className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                        selectedMode === mode
                          ? 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
                          : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      } ${(isTestActive || isTestComplete) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {label}
                    </button>
                  )) }
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600 dark:text-primary-400">🌐</span>
                <div className="flex space-x-1">
                  { [
                    { lang: Language.ENGLISH, label: 'english' },
                    { lang: Language.FRENCH, label: 'français' }
                  ].map(({ lang, label }) => (
                    <button
                      key={lang}
                      onClick={() => {
                        if (!isTestActive && !isTestComplete) {
                          setSelectedLanguage(lang);
                          resetTest();
                        }
                      }}
                      disabled={isTestActive || isTestComplete}
                      className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                        selectedLanguage === lang
                          ? 'text-gray-700 dark:text-primary-200 bg-gray-200 dark:bg-primary-700'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-primary-200 hover:bg-gray-200 dark:hover:bg-primary-700'
                      } ${(isTestActive || isTestComplete) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {label}
                    </button>
                  )) }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typing Test - Clean centered layout like MonkeyType */}
        <div className="mx-auto px-4">
          {/* Stats Display - Show during active test */}
          {isTestActive && (
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
          )}
          
          {/* Typing Area */}
          <div 
            className="relative cursor-text w-full overflow-hidden mb-8"
            style={{ height: '140px' }}
            onClick={() => {
              if (!isTestComplete && textAreaRef.current) {
                textAreaRef.current.focus();
              }
            }}
          >
            <div
              className={`max-w-full mx-auto h-full flex flex-col justify-center gap-1 px-4 md:px-8 transition-all duration-300 ${!isTestActive && !isTestComplete ? 'blur-[1px]' : ''}`}
              style={{ whiteSpace: 'pre-wrap', fontSize: fontSizeClass.startsWith('text-') ? undefined : fontSizeClass.replace('text-[','').replace(']','') }}
            >
              <span className={`font-mono ${fontSizeClass}`}>
                {getCharacterDisplay()}
              </span>
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
                <div className="bg-white/90 dark:bg-primary-800/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg border border-gray-200 dark:border-primary-700">
                  <div className="text-center text-gray-700 dark:text-primary-200">
                    <p className="text-lg font-medium mb-1">Click in the text area and start typing</p>
                    <p className="text-sm opacity-75 mb-2">Selected: {selectedMode} • {selectedLanguage === 'french' ? 'Français' : 'English'}</p>
                    <p className="text-xs opacity-60">Begin with the first character to start the timer</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Complete Screen */}
          {isTestComplete && (
            <div className="text-center p-8 mb-6">
              <h2 className="text-2xl font-bold text-primary-600 dark:text-[#ffca8d] mb-6">Test Complete!</h2>
              
              {/* Performance Graph */}
              {wpmHistory.length > 0 && (
                <div className="mb-8 bg-gray-50 dark:bg-primary-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Over Time</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={wpmHistory.map((wpmPoint, index) => {
                        const errorPoint = errorHistory[index];
                        return {
                          ...wpmPoint,
                          errors: errorPoint && errorPoint.errors > 0 ? wpmPoint.wpm : null
                        };
                      })}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6B7280"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${value}s`}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          tick={{ fontSize: 12 }}
                          domain={[0, 'dataMax + 10']}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any, name: string) => {
                            if (name === 'wpm') return [`${value} WPM`, 'WPM'];
                            if (name === 'raw') return [`${value} Raw`, 'Raw WPM'];
                            if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                            if (name === 'errors') {
                              // Find the actual error count for this time point
                              const dataIndex = wpmHistory.findIndex(h => h.wpm === value);
                              const actualErrors = dataIndex >= 0 && errorHistory[dataIndex] ? errorHistory[dataIndex].errors : 0;
                              return [`${actualErrors} Error${actualErrors !== 1 ? 's' : ''}`, 'Errors'];
                            }
                            return [value, name];
                          }}
                          labelFormatter={(value) => `Time: ${value}s`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="wpm" 
                          stroke="#FBBF24" 
                          strokeWidth={3}
                          dot={{ fill: '#FBBF24', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#FBBF24', strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="raw" 
                          stroke="#6B7280" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="errors" 
                          stroke="transparent" 
                          strokeWidth={0}
                          dot={{ fill: '#EF4444', strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#EF4444' }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-6 mt-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300">Net WPM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-1 bg-gray-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300">Raw WPM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-300">Errors</span>
                    </div>
                  </div>
                </div>
              )}

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
              
              {/* Additional Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-8 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {wpmHistory.length > 0 ? Math.max(...wpmHistory.map(h => h.raw)) : 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">Raw</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {totalChars}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {wpmHistory.length > 0 ? 
                      Math.round((wpmHistory.reduce((sum, h) => sum + h.wpm, 0) / wpmHistory.length) * 100) / 100 
                      : 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">Consistency</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                    {getTestDuration(selectedMode)}s
                  </div>
                  <div className="text-xs text-gray-500 dark:text-primary-400 uppercase tracking-wide">Time</div>
                </div>
              </div>
              
              {/* Submission Status */}
              {user && (
                <div className="mb-4">
                  {isSubmittingResult ? (
                    <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span className="text-sm">Saving your result...</span>
                    </div>
                  ) : null}
                </div>
              )}
              
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
              <p className="text-sm">Focus on the text area above and start typing to begin the test</p>
            </div>
          )}
        </div>

        {/* Instructions - Clean and minimal */}
        {!isTestActive && !isTestComplete && (
          <div className="max-w-4xl mx-auto mt-20 text-center">
            <div className="text-sm text-gray-500 dark:text-primary-400 space-y-2">
              <p>Click on the text area to start • Type the words exactly as shown • Use backspace to correct mistakes</p>
              <p>Your WPM and accuracy will be calculated in real-time</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;