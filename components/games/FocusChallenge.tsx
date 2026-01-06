import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  runOnJS
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  pairId: number;
}

interface FocusChallengeProps {
  onComplete: () => void;
}

const positiveSymbols = ['🌳', '☀️', '😊'];
const additionalSymbols = ['🌈', '⭐'];

export default function FocusChallenge({ onComplete }: FocusChallengeProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  
  const gameTimer = useRef<NodeJS.Timeout>();
  const flipTimer = useRef<NodeJS.Timeout>();
  const messageTimer = useRef<NodeJS.Timeout>();
  const allSymbols = [...positiveSymbols, ...additionalSymbols]; // 5 symboles = 5 paires (10 cartes)
  const totalPairs = 5; // 10 cartes = 5 paires

  const initializeGame = () => {
    // Créer 5 paires de cartes
    const cardPairs: Card[] = [];
    
    allSymbols.forEach((symbol, index) => {
      // Ajouter deux cartes identiques pour chaque symbole
      cardPairs.push(
        {
          id: index * 2,
          symbol,
          isFlipped: false,
          isMatched: false,
          pairId: index
        },
        {
          id: index * 2 + 1,
          symbol,
          isFlipped: false,
          isMatched: false,
          pairId: index
        }
      );
    });

    // Mélanger les cartes
    const shuffledCards = cardPairs.sort(() => Math.random() - 0.5);
    
    // Montrer toutes les cartes pendant 2 secondes
    setCards(shuffledCards.map(card => ({ ...card, isFlipped: true })));
    
    setTimeout(() => {
      setCards(prev => prev.map(card => ({ ...card, isFlipped: false })));
      setGameStarted(true);
      startTimer();
    }, 2000);
  };

  const startTimer = () => {
    gameTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeGame = () => {
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (flipTimer.current) clearTimeout(flipTimer.current);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    
    setTimeout(() => {
      setGameCompleted(true);
    }, 0);
  };

  const handleCardPress = (cardId: number) => {
    if (!gameStarted || flippedCards.length >= 2 || gameCompleted) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Paire trouvée !
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isMatched: true } 
              : c
          ));
          
          setMatchedPairs(prev => {
            const newCount = prev + 1;
            if (newCount === totalPairs) {
              setTimeout(() => completeGame(), 1000);
            }
            return newCount;
          });
          
          showPositiveMessage();
        }, 500);
      } else {
        // Pas de correspondance, retourner les cartes
        flipTimer.current = setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false } 
              : c
          ));
        }, 1000);
      }
      
      setTimeout(() => {
        setFlippedCards([]);
      }, 500);
    }
  };

  const showPositiveMessage = () => {
    setShowMessage(true);
    
    messageTimer.current = setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  const handleReturnToEmergency = () => {
    setTimeout(() => onComplete(), 0);
  };

  useEffect(() => {
    initializeGame();
    
    return () => {
      if (gameTimer.current) clearInterval(gameTimer.current);
      if (flipTimer.current) clearTimeout(flipTimer.current);
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  if (gameCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>Focus Challenge terminé</Text>
          <Text style={styles.completionMessage}>
            Vous avez exercé votre mémoire et détourné votre attention avec succès.
          </Text>
          
          <TouchableOpacity 
            style={styles.returnButton}
            onPress={handleReturnToEmergency}
          >
            <Text style={styles.returnButtonText}>Retour à Urgence</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Challenge</Text>
        <Text style={styles.subtitle}>Mémoire et concentration</Text>
        
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Temps restant : {timeLeft}s</Text>
        </View>

        {!gameStarted && (
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              Mémorisez les positions des cartes...
            </Text>
          </View>
        )}
      </View>

      <View style={styles.gameArea}>
        <View style={styles.cardsGrid}>
          {cards.map((card) => (
            <AnimatedCard
              key={card.id}
              card={card}
              onPress={() => handleCardPress(card.id)}
              disabled={!gameStarted}
            />
          ))}
        </View>

        {showMessage && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Bravo, chaque petite victoire compte</Text>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Trouvez les paires de symboles identiques
        </Text>
        <Text style={styles.instructionSubtext}>
          Chaque paire trouvée vous encourage !
        </Text>
      </View>
    </View>
  );
}

interface AnimatedCardProps {
  card: Card;
  onPress: () => void;
  disabled: boolean;
}

function AnimatedCard({ card, onPress, disabled }: AnimatedCardProps) {
  const flipAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(1);

  useEffect(() => {
    flipAnimation.value = withTiming(card.isFlipped ? 1 : 0, { duration: 300 });
  }, [card.isFlipped]);

  useEffect(() => {
    if (card.isMatched) {
      scaleAnimation.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
    }
  }, [card.isMatched]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${flipAnimation.value * 180}deg` },
      { scale: scaleAnimation.value }
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flipAnimation.value,
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: 1 - flipAnimation.value,
  }));

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      disabled={disabled || card.isFlipped || card.isMatched}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Face arrière */}
        <Animated.View style={[styles.cardBack, backStyle]}>
          <Text style={styles.cardBackText}>?</Text>
        </Animated.View>
        
        {/* Face avant */}
        <Animated.View style={[styles.cardFront, frontStyle]}>
          <Text style={styles.cardSymbol}>{card.symbol}</Text>
        </Animated.View>
        
        {card.isMatched && (
          <View style={styles.matchedOverlay}>
            <Text style={styles.matchedText}>✓</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    marginBottom: 24,
  },
  timerContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instructionBox: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  cardContainer: {
    width: (width - 140) / 5,
    height: (width - 140) / 5,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    position: 'relative',
  },
  cardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  cardBackText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#6B7280',
  },
  cardSymbol: {
    fontSize: 32,
  },
  matchedOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  matchedText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  messageContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderRadius: 16,
    padding: 16,
    minWidth: 200,
    alignItems: 'center',
    marginLeft: -100,
    marginTop: -25,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instructions: {
    padding: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  completionTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  completionMessage: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  returnButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  returnButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});