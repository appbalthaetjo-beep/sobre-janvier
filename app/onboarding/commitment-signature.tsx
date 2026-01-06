import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useHaptics } from '@/hooks/useHaptics';

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
    router.push('/onboarding/personal-goals');
  };

  const handleBack = () => {
    router.back();
  };

  const hasSignature = paths.length > 0 || currentPath.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Contenu principal scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDrawing}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Signez votre engagement</Text>
          <Text style={styles.subtitle}>
            Promettez-vous que vous ne regarderez plus jamais de pornographie.
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
          style={[
            styles.continueButton,
            !hasSignature && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!hasSignature}
        >
          <Text style={[
            styles.continueButtonText,
            !hasSignature && styles.continueButtonTextDisabled
          ]}>
            Continuer
          </Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
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
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  continueButtonTextDisabled: {
    color: '#666666',
  },
});
