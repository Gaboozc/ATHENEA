import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import Chip from '../ui/Chip';

interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  title?: string;
  options: FilterOption[];
  selectedKeys: string[];
  onFilterChange: (selectedKeys: string[]) => void;
  multiSelect?: boolean;
  showCounts?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  title,
  options,
  selectedKeys,
  onFilterChange,
  multiSelect = true,
  showCounts = true,
}) => {
  const handleFilterPress = (key: string) => {
    if (multiSelect) {
      const newSelectedKeys = selectedKeys.includes(key)
        ? selectedKeys.filter(k => k !== key)
        : [...selectedKeys, key];
      onFilterChange(newSelectedKeys);
    } else {
      onFilterChange(selectedKeys.includes(key) ? [] : [key]);
    }
  };

  const renderFilterChip = ({ item }: { item: FilterOption }) => (
    <Chip
      label={showCounts && item.count !== undefined 
        ? `${item.label} (${item.count})` 
        : item.label
      }
      selected={selectedKeys.includes(item.key)}
      onPress={() => handleFilterPress(item.key)}
      variant="outlined"
      size="small"
      style={styles.chip}
    />
  );

  return (
    <View style={styles.container}>
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      
      <FlatList
        data={options}
        renderItem={renderFilterChip}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chipContainer: {
    paddingHorizontal: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 0,
  },
});

export default FilterBar;