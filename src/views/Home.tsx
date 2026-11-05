'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ComposedChart, Area, Line, ReferenceDot, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TestMode, Language } from '../types';
import { typingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { generateTypingText } from '../lib/typing/words';

const FONT_STEP_MIN = -3;
const FONT_STEP_MAX = 4;

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
  
  // the server has no window: start at a desktop width and read the real one as soon as the page is in the browser
  const [windowWidth, setWindowWidth] = useState(1280);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textBoxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  
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

  // Font size: step 0 is the default for this screen. Each step is 2px, and the choice is remembered.
  const [fontStep, setFontStep] = useState(0);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem('typingFontStep'));
      if (Number.isInteger(saved) && saved >= FONT_STEP_MIN && saved <= FONT_STEP_MAX) setFontStep(saved);
    } catch {
      /* private mode: the default size is fine */
    }
  }, []);
  const changeFont = (delta: number) => {
    setFontStep((prev) => {
      const next = Math.min(FONT_STEP_MAX, Math.max(FONT_STEP_MIN, prev + delta));
      try {
        localStorage.setItem('typingFontStep', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  const baseFontPx = windowWidth < 480 ? 17 : windowWidth < 768 ? 19 : windowWidth < 1024 ? 22 : 26;
  const fontPx = Math.max(12, baseFontPx + fontStep * 2);

  // line length follows the real width of the text box, so no line is ever cut off
  useEffect(() => {
    const el = textBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // A new text is generated for every test (see lib/typing/words.ts)
  const getRandomText = useCallback((language: Language, durationSeconds: number): string => {
    return generateTypingText(language === Language.FRENCH ? 'french' : 'english', durationSeconds);
  }, []);

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
    
    setDisplayText(getRandomText(selectedLanguage, newTimeLeft));
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
    setDisplayText(getRandomText(selectedLanguage, newTimeLeft));
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
    // JetBrains Mono is 0.6em wide; one column is kept for the space that ends each line
    const maxLineLength = boxWidth > 0 ? Math.max(12, Math.floor(boxWidth / (fontPx * 0.6)) - 2) : 40;

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
          <div key={`empty-${displayIndex}`} className="h-[2.75rem] flex items-center justify-center">
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
        let className = 'text-primary-500 dark:text-primary-300/75'; // Default untyped
        
        if (globalIndex < userInput.length) {
          if (userInput[globalIndex] === displayText[globalIndex]) {
            className = 'text-primary-950 dark:text-ember-200';
          } else {
            className = 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-500/15 rounded-sm';
          }
        } else if (globalIndex === currentIndex && isTestActive) {
          className = 'bg-primary-600 text-white dark:bg-ember-300 dark:text-primary-950 rounded-sm';
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
      
      if (lineData.originalIndex < lines.length - 1) {
        const gi = startIndex + lineData.text.length;
        let cls = 'text-primary-500 dark:text-primary-300/75';
        if (gi < userInput.length) cls = userInput[gi] === displayText[gi] ? 'text-primary-950 dark:text-ember-200' : 'bg-red-500/20 rounded-sm';
        else if (gi === currentIndex && isTestActive) cls = 'bg-primary-600 dark:bg-ember-300 rounded-sm';
        lineElements.push(<span key={gi} className={cls}>{' '}</span>);
      }

      return (
        <div key={displayIndex} className="h-[2.75rem] flex items-center justify-center whitespace-nowrap">
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

  // Responsive font size for typing area (more granular, improved for mobile)
  // One point per second: points are recorded on every key press, so keep the last one in each second.
  const chartData = (() => {
    const bySecond = new Map<number, { time: number; wpm: number; raw: number; accuracy: number; errors: number }>();
    wpmHistory.forEach((p, i) => {
      const sec = Math.round(p.time);
      const newErrors = Math.max(0, errorHistory[i]?.errors ?? 0);
      const prev = bySecond.get(sec);
      bySecond.set(sec, { time: sec, wpm: p.wpm, raw: p.raw, accuracy: p.accuracy, errors: (prev?.errors ?? 0) + newErrors });
    });
    return Array.from(bySecond.values()).sort((a, b) => a.time - b.time);
  })();

  // Consistency: how even your speed was from second to second (100 is perfectly steady)
  const consistency = (() => {
    const speeds: number[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const a = chartData[i - 1];
      const b = chartData[i];
      const chars = (b.raw * b.time) / 5 - (a.raw * a.time) / 5;
      const dt = b.time - a.time;
      if (dt > 0) speeds.push(Math.max(0, (chars / dt) * 12));
    }
    if (speeds.length < 3) return 0;
    const mean = speeds.reduce((x, y) => x + y, 0) / speeds.length;
    if (mean === 0) return 0;
    const sd = Math.sqrt(speeds.reduce((x, y) => x + (y - mean) ** 2, 0) / speeds.length);
    return Math.max(0, Math.min(100, Math.round(100 - (sd / mean) * 50)));
  })();
  const testSeconds = getTestDuration(selectedMode);
  const rawOverall = totalChars > 0 ? Math.round(totalChars / 5 / (testSeconds / 60)) : 0;

  let fontSizeClass = 'text-xl';
  if (windowWidth < 340) fontSizeClass = 'text-[0.8rem]'; // very small phones
  else if (windowWidth < 375) fontSizeClass = 'text-sm'; // iPhone SE
  else if (windowWidth < 430) fontSizeClass = 'text-base'; // iPhone 14 Pro Max
  else if (windowWidth < 480) fontSizeClass = 'text-lg'; // medium phones
  else if (windowWidth < 540) fontSizeClass = 'text-xl'; // phablets
  else if (windowWidth < 640) fontSizeClass = 'text-lg'; // small tablets
  else if (windowWidth < 768) fontSizeClass = 'text-lg'; // tablets
  else if (windowWidth < 1024) fontSizeClass = 'text-xl'; // laptops
  else fontSizeClass = 'text-2xl';

  return (
    <div className="min-h-screen text-primary-950 dark:text-primary-100">
      <div className="w-full max-w-7xl px-4 sm:px-6 py-5 sm:py-8 mx-auto">
        <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary-950 dark:text-ember-300 text-balance">
            How fast can you type?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-primary-700 dark:text-primary-300">
            A free typing speed test. Pick a length, start typing, and watch your words per minute and accuracy update live.
          </p>
        </div>

        {!isTestActive && !isTestComplete && (
          <div className="mb-8 sm:mb-12 flex flex-wrap items-center justify-center gap-3">
            <div role="group" aria-label="Test length in seconds" className="segmented">
              {[
                { mode: TestMode.FIFTEEN_SECONDS, label: '15' },
                { mode: TestMode.THIRTY_SECONDS, label: '30' },
                { mode: TestMode.SIXTY_SECONDS, label: '60' },
                { mode: TestMode.ONE_TWENTY_SECONDS, label: '120' },
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={selectedMode === mode}
                  className="segment"
                  onClick={() => {
                    setSelectedMode(mode);
                    resetTest();
                  }}
                >
                  {label}s
                </button>
              ))}
            </div>
            <div role="group" aria-label="Language" className="segmented">
              {[
                { lang: Language.ENGLISH, label: 'English' },
                { lang: Language.FRENCH, label: 'Français' },
              ].map(({ lang, label }) => (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={selectedLanguage === lang}
                  className="segment"
                  onClick={() => {
                    setSelectedLanguage(lang);
                    resetTest();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Text size" className="segmented">
              <button
                type="button"
                className="segment !px-3"
                onClick={() => changeFont(-1)}
                disabled={fontStep <= FONT_STEP_MIN}
                aria-label="Make text smaller"
                title="Smaller text"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <span className="select-none px-1 text-sm font-medium text-primary-700 dark:text-primary-300" aria-hidden="true">
                Aa
              </span>
              <button
                type="button"
                className="segment !px-3"
                onClick={() => changeFont(1)}
                disabled={fontStep >= FONT_STEP_MAX}
                aria-label="Make text bigger"
                title="Bigger text"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Typing Test - Clean centered layout like MonkeyType */}
        <div className="mx-auto px-0 sm:px-4 w-full max-w-full">
          {/* Stats Display - Show during active test */}
          {isTestActive && (
            <div className="flex flex-wrap justify-center gap-4 sm:space-x-12 mb-4 sm:mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold tabular font-mono text-primary-700 dark:text-ember-300">{timeLeft}</div>
                <div className="text-xs text-primary-600 dark:text-primary-400">Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold tabular font-mono text-primary-700 dark:text-ember-300">{wpm}</div>
                <div className="text-xs text-primary-600 dark:text-primary-400">WPM</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold tabular font-mono text-primary-700 dark:text-ember-300">{accuracy}%</div>
                <div className="text-xs text-primary-600 dark:text-primary-400">Accuracy</div>
              </div>
            </div>
          )}
          
          {/* Typing Area */}
          <div 
            className="card relative cursor-text w-full overflow-hidden mb-6 sm:mb-8 min-h-[200px] sm:min-h-[240px] py-6 sm:py-8 transition-shadow focus-within:border-primary-500 dark:focus-within:border-ember-300/50 focus-within:ring-2 focus-within:ring-primary-500/25 dark:focus-within:ring-ember-300/15"
            onClick={() => {
              if (!isTestComplete && textAreaRef.current) {
                textAreaRef.current.focus();
              }
            }}
          >
            <div ref={textBoxRef} className="mx-auto flex h-full flex-col justify-center px-4 sm:px-8 font-mono leading-none" style={{ fontSize: `${fontPx}px` }}>
              {getCharacterDisplay()}
            </div>
            {/* Visible textarea for mobile accessibility */}
            <textarea
              ref={textAreaRef}
              value={userInput}
              onChange={handleInput}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              aria-label="Typing area. Start typing the text shown to begin the test."
              className="absolute inset-0 w-full h-full opacity-0 resize-none outline-none z-10"
              disabled={isTestComplete}
              placeholder=""
              tabIndex={0}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
            />
            {/* Focus overlay, pointer-events-none so textarea is always focusable */}
            {(!isTestActive && !isTestComplete && !isInputFocused) && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
                <div className="rounded-full border border-primary-200 bg-white/90 px-4 py-1.5 dark:border-ember-300/20 dark:bg-primary-950/90">
                  <div className="text-center text-primary-800 dark:text-ember-200">
                    <p className="text-sm font-medium">Click here and start typing. The timer starts with your first key.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Complete Screen */}
          {isTestComplete && (
            <div className="text-center py-4 mb-6">
              <h2 className="sr-only">Test complete</h2>

              <dl className="mx-auto mb-6 grid w-full grid-cols-3 gap-3 sm:gap-6 text-center">
                {[
                  { label: 'Words per minute', value: String(wpm) },
                  { label: 'Accuracy', value: accuracy + '%' },
                  { label: 'Correct characters', value: correctChars + '/' + totalChars },
                ].map((m) => (
                  <div key={m.label} className="card px-3 py-5 sm:px-6 sm:py-8">
                    <dt className="text-xs sm:text-sm text-primary-600 dark:text-primary-300">{m.label}</dt>
                    <dd className="mt-1 font-mono text-xl min-[420px]:text-2xl sm:text-3xl lg:text-4xl break-all font-bold tabular text-primary-950 dark:text-ember-300">{m.value}</dd>
                  </div>
                ))}
              </dl>

              {chartData.length > 0 && (
                <div className="card mx-auto mb-6 w-full p-4 sm:p-8 text-center">
                  <div className="mb-5 flex flex-col items-center justify-center gap-3">
                    <h3 className="text-base font-semibold text-primary-950 dark:text-ember-300">Speed over time</h3>
                    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs sm:text-sm text-primary-700 dark:text-primary-300" aria-label="Chart key">
                      <li className="flex items-center gap-2"><span className="h-0.5 w-4 rounded bg-primary-600 dark:bg-ember-300" />Net WPM</li>
                      <li className="flex items-center gap-2"><span className="w-4 border-t-2 border-dashed border-primary-400" />Raw WPM</li>
                      <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400" />Mistakes</li>
                    </ul>
                  </div>
                  <div className="h-60 sm:h-80 lg:h-96 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                        <defs>
                          <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffca8d" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#ffca8d" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#8d629b" strokeOpacity={0.2} vertical={false} />
                        <XAxis dataKey="time" type="number" domain={[0, 'dataMax']} stroke="#a688b3" tick={{ fontSize: 12, fill: '#a688b3' }} tickLine={false} tickFormatter={(v) => v + 's'} minTickGap={28} />
                        <YAxis stroke="#a688b3" tick={{ fontSize: 12, fill: '#a688b3' }} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (max: number) => Math.ceil((max + 10) / 10) * 10]} width={44} />
                        <Tooltip
                          cursor={{ stroke: '#ffca8d', strokeOpacity: 0.4 }}
                          contentStyle={{ backgroundColor: '#25101f', border: '1px solid rgba(255,202,141,0.25)', borderRadius: 10, color: '#ffe3c4', fontSize: 13 }}
                          labelStyle={{ color: '#ffca8d', fontWeight: 600 }}
                          itemStyle={{ color: '#ffe3c4' }}
                          labelFormatter={(v) => v + ' seconds'}
                          formatter={(value, name) => {
                            if (name === 'wpm') return [value + ' WPM', 'Net'];
                            if (name === 'raw') return [value + ' WPM', 'Raw'];
                            return [value, String(name)];
                          }}
                        />
                        <Area type="monotone" dataKey="wpm" stroke="none" fill="url(#wpmFill)" isAnimationActive={false} legendType="none" tooltipType="none" />
                        <Line type="monotone" dataKey="raw" stroke="#a688b3" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="wpm" stroke="#ffca8d" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#ffca8d', stroke: '#25101f', strokeWidth: 2 }} isAnimationActive={false} />
                        {chartData.filter((p) => p.errors > 0).map((p) => (
                          <ReferenceDot key={p.time} x={p.time} y={p.wpm} r={4} fill="#f87171" stroke="#25101f" strokeWidth={1.5} />
                        ))}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <dl className="mx-auto mb-8 grid w-full grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl border border-primary-200 bg-primary-200 dark:border-ember-300/10 dark:bg-ember-300/10">
                {[
                  { label: 'Raw WPM', value: String(rawOverall), hint: 'Speed with mistakes counted' },
                  { label: 'Characters typed', value: String(totalChars), hint: '' },
                  { label: 'Consistency', value: consistency + '%', hint: 'How steady your pace was' },
                  { label: 'Test length', value: testSeconds + 's', hint: '' },
                ].map((m) => (
                  <div key={m.label} className="bg-white px-4 py-5 text-center dark:bg-primary-900" title={m.hint || undefined}>
                    <dt className="text-xs text-primary-600 dark:text-primary-300">{m.label}</dt>
                    <dd className="mt-1 font-mono text-xl font-semibold tabular text-primary-950 dark:text-ember-200">{m.value}</dd>
                  </div>
                ))}
              </dl>

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
                className="btn-primary px-8"
              >
                Try again
              </button>
            </div>
          )}

          {!isTestActive && !isTestComplete && (
            <div className="text-center text-primary-600 dark:text-primary-400 mb-4">
              <p className="text-sm">Focus on the text area above and start typing to begin the test</p>
            </div>
          )}
        </div>

        {/* Instructions - Clean and minimal */}
        {!isTestActive && !isTestComplete && (
          <div className="max-w-4xl mx-auto mt-12 sm:mt-20 text-center">
            <div className="text-sm text-primary-600 dark:text-primary-400 space-y-2">
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