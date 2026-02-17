import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useHaptics } from '@/hooks/useHaptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const signatureAreaWidth = width - 48;
const signatureAreaHeight = 200;

interface Point {
  x: number;
  y: number;
}

export default function CommitmentSignatureScreen() {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const pathRef = useRef<Point[]>([]);
  const moveCountRef = useRef(0);
  const { triggerTap } = useHaptics();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setIsDrawing(true);
      moveCountRef.current = 0;
      triggerTap('light');
      pathRef.current = [{ x: locationX, y: locationY }];
      setCurrentPath([{ x: locationX, y: locationY }]);
    },

    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const newPoint = { x: locationX, y: locationY };
      pathRef.current.push(newPoint);
      setCurrentPath([...pathRef.current]);
      moveCountRef.current += 1;
      if (moveCountRef.current % 8 === 0) {
        triggerTap('light');
      }
    },

    onPanResponderRelease: () => {
      setIsDrawing(false);
      if (pathRef.current.length > 1) {
        const pathString = createSVGPath(pathRef.current);
        setPaths(prev => [...prev, pathString]);
      }
      setCurrentPath([]);
      pathRef.current = [];
    },
    onPanResponderTerminate: () => {
      setIsDrawing(false);
      setCurrentPath([]);
      pathRef.current = [];
    },
  });

  const createSVGPath = (points: Point[]): string => {
    if (points.length === 0) return '';
    
    let path = `M${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    
    return path;
  };

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath([]);
    pathRef.current = [];
  };

  const handleContinue = () => {
    triggerTap('medium');
    router.push('/onboarding/rate-us');
  };

  const handleBack = () => {
    router.back();
  };

  const hasSignature = paths.length > 0 || currentPath.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            triggerTap('light');
            handleBack();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      {/* Contenu principal scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDrawing}
      >
        <View style={styles.questionSection}>
          <Text style={styles.questionText}>Signe ton engagement</Text>
          <Text style={styles.helperText}>
            Fais une promesse à toi-même : arrêter la pornographie.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureContainer}>
            <View
              style={styles.signatureArea}
              pointerEvents="box-only"
              {...panResponder.panHandlers}
            >
              <Svg
                width={signatureAreaWidth}
                height={signatureAreaHeight}
                style={styles.svgSignature}
              >
                {paths.map((path, index) => (
                  <Path
                    key={index}
                    d={path}
                    stroke="#000000"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                {currentPath.length > 1 && (
                  <Path
                    d={createSVGPath(currentPath)}
                    stroke="#000000"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </Svg>

              {!hasSignature && (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>✍️</Text>
                  <Text style={styles.placeholderSubtext}>Dessinez votre signature ici</Text>
                </View>
              )}
            </View>
          </View>

          {hasSignature && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSignature}
            >
              <Text style={styles.clearButtonText}>Effacer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsText}>
            Dessinez dans l'espace ouvert ci-dessus
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button Container - TOUJOURS VISIBLE */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, !hasSignature && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!hasSignature}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#F7E08A', '#D6A93A', '#B17A10']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.continueButtonGradient}
          >
            <Text style={[styles.continueButtonText, !hasSignature && styles.continueButtonTextDisabled]}>
              Continuer
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  questionSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'flex-start',
  },
  questionText: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    lineHeight: 38,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },
  signatureSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  signatureContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: signatureAreaWidth + 32,
    height: signatureAreaHeight + 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  signatureArea: {
    width: signatureAreaWidth,
    height: signatureAreaHeight,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgSignature: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  instructionsSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
  },
  bottomContainer: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueButtonGradient: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#6B4A00',
  },
  continueButtonTextDisabled: {
    color: '#2B1B00',
  },
});
