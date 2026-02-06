import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TouchableOpacity,
  Text,
} from 'react-native';
import Svg, { G, Rect, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Point } from '../../store/slices/pointsSlice';

interface InteractiveFloorPlanProps {
  width?: number;
  height?: number;
  points: Point[];
  onPointPress?: (point: Point) => void;
  onAddPoint?: (x: number, y: number) => void;
  editable?: boolean;
  floorPlanImage?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const InteractiveFloorPlan: React.FC<InteractiveFloorPlanProps> = ({
  width = SCREEN_WIDTH - 40,
  height = SCREEN_HEIGHT - 200,
  points = [],
  onPointPress,
  onAddPoint,
  editable = false,
}) => {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [mode, setMode] = useState<'view' | 'add'>('view');

  const pan = useRef(new Animated.ValueXY()).current;
  const lastScale = useRef(1);
  const lastTranslate = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: translateX,
          y: translateY,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (mode === 'view') {
          pan.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (mode === 'add' && editable) {
          // Calculate the tap position in floor plan coordinates
          const tapX = (evt.nativeEvent.locationX - translateX) / scale;
          const tapY = (evt.nativeEvent.locationY - translateY) / scale;
          
          if (onAddPoint) {
            onAddPoint(tapX, tapY);
            setMode('view');
          }
        } else {
          pan.flattenOffset();
          const newX = translateX + gestureState.dx;
          const newY = translateY + gestureState.dy;
          setTranslateX(newX);
          setTranslateY(newY);
        }
      },
    })
  ).current;

  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.5, 5);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.5, 0.5);
    setScale(newScale);
  };

  const handleReset = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    pan.setValue({ x: 0, y: 0 });
  };

  const getPointColor = (point: Point): string => {
    switch (point.type) {
      case 'data':
        return '#2196F3';
      case 'voice':
        return '#4CAF50';
      case 'video':
        return '#9C27B0';
      case 'power':
        return '#FF9800';
      case 'fiber':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusColor = (status: Point['status']): string => {
    switch (status) {
      case 'planned':
        return '#FFF';
      case 'installed':
        return '#4CAF50';
      case 'tested':
        return '#2196F3';
      case 'certified':
        return '#9C27B0';
      case 'failed':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {/* Control buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
          <Text style={styles.controlButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
          <Text style={styles.controlButtonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <Text style={styles.controlButtonText}>⟲</Text>
        </TouchableOpacity>
        {editable && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              mode === 'add' && styles.activeButton,
            ]}
            onPress={() => setMode(mode === 'view' ? 'add' : 'view')}
          >
            <Text style={styles.controlButtonText}>
              {mode === 'add' ? '✓' : '+'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {mode === 'add' && (
        <View style={styles.modeIndicator}>
          <Text style={styles.modeText}>Tap to add point</Text>
        </View>
      )}

      {/* SVG Floor Plan */}
      <Animated.View
        style={[
          styles.svgContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Background grid */}
          <G>
            {Array.from({ length: 20 }).map((_, i) => (
              <React.Fragment key={`grid-${i}`}>
                <Line
                  x1={0}
                  y1={(i * height) / 20}
                  x2={width}
                  y2={(i * height) / 20}
                  stroke="#e0e0e0"
                  strokeWidth="0.5"
                />
                <Line
                  x1={(i * width) / 20}
                  y1={0}
                  x2={(i * width) / 20}
                  y2={height}
                  stroke="#e0e0e0"
                  strokeWidth="0.5"
                />
              </React.Fragment>
            ))}
          </G>

          {/* Sample floor plan outline */}
          <Rect
            x={50}
            y={50}
            width={width - 100}
            height={height - 100}
            fill="none"
            stroke="#333"
            strokeWidth="2"
          />

          {/* Sample rooms */}
          <Rect
            x={60}
            y={60}
            width={(width - 120) / 2}
            height={(height - 120) / 2}
            fill="none"
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          <Rect
            x={60 + (width - 120) / 2}
            y={60}
            width={(width - 120) / 2}
            height={(height - 120) / 2}
            fill="none"
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          <Rect
            x={60}
            y={60 + (height - 120) / 2}
            width={width - 120}
            height={(height - 120) / 2}
            fill="none"
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="5,5"
          />

          {/* Points */}
          {points.map((point) => {
            const pointColor = getPointColor(point);
            const statusColor = getStatusColor(point.status);

            return (
              <G
                key={point.id}
                onPress={() => onPointPress && onPointPress(point)}
              >
                {/* Point marker */}
                <Circle
                  cx={point.coordinates.x}
                  cy={point.coordinates.y}
                  r={8}
                  fill={pointColor}
                  stroke={statusColor}
                  strokeWidth={2}
                  opacity={0.9}
                />
                {/* Point number */}
                <SvgText
                  x={point.coordinates.x}
                  y={point.coordinates.y + 20}
                  fontSize="10"
                  fill="#333"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {point.pointNumber}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </Animated.View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Point Types:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>Data</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Voice</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
            <Text style={styles.legendText}>Video</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Power</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Fiber</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  svgContainer: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'column',
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  activeButton: {
    backgroundColor: '#2196F3',
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modeIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  legend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});

export default InteractiveFloorPlan;
