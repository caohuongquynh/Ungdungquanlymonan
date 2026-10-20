import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LanguageContext, LanguageProvider } from '../context/LanguageContext';
import { getCategories, getDishes, initStorage, saveDishes } from '../database/storage';
import { fetchDishesFromMockAPI, listenNetworkAndSync, MOCK_API_URL } from '../services/syncService';

function DishListContent() {
  const router = useRouter();
  const context = useContext(LanguageContext);
  const t = context?.t || {};
  const lang = context?.lang || 'en';
  const toggleLanguage = context?.toggleLanguage;

  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('none');

  const loadData = async () => {
    await initStorage();
    const localData = await getDishes();
    
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      const apiData = await fetchDishesFromMockAPI();
      if (apiData && apiData.length > 0) {
        setDishes(apiData);
      } else {
        setDishes(localData);
      }
    } else {
      setDishes(localData);
    }
    setCategories(await getCategories());
  };

  useEffect(() => {
    loadData();
    const unsub = listenNetworkAndSync();
    return () => unsub();
  }, []);

  const handleDeleteDish = (id: any) => {
    const targetId = String(id);
    const confirmMessage = lang === 'en' 
      ? 'Are you sure you want to delete this dish?' 
      : 'Bạn có chắc chắn muốn xóa món ăn này?';

    const executeDelete = async () => {
      const updated = dishes.filter(d => String(d.id || d.BIT240202_Id) !== targetId);
      setDishes(updated);
      await saveDishes(updated);

      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        try {
          await axios.delete(`${MOCK_API_URL}/${targetId}`);
        } catch (e) {
          console.log("Lỗi xóa trên MockAPI, nhưng đã xóa ở local.");
        }
      }
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(confirmMessage)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        lang === 'en' ? 'Delete Dish' : 'Xóa món ăn',
        confirmMessage,
        [
          { text: lang === 'en' ? 'Cancel' : 'Hủy', style: 'cancel' },
          {
            text: lang === 'en' ? 'Delete' : 'Xóa',
            style: 'destructive',
            onPress: executeDelete
          }
        ]
      );
    }
  };

  const filteredDishes = dishes.filter(dish => {
    const matchName = dish.BIT240202_Name?.toLowerCase().includes(searchText.toLowerCase().trim());
    const matchCat = selectedCategory ? dish.BIT240202_DishCategoryId === selectedCategory : true;
    const matchAvailable = availableOnly ? dish.BIT240202_IsAvailable === true : true;
    
    const price = Number(dish.BIT240202_Price);
    const matchMin = minPrice !== '' ? price >= Number(minPrice) : true;
    const matchMax = maxPrice !== '' ? price <= Number(maxPrice) : true;

    return matchName && matchCat && matchAvailable && matchMin && matchMax;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.BIT240202_Price - b.BIT240202_Price;
    if (sortBy === 'price_desc') return b.BIT240202_Price - a.BIT240202_Price;
    if (sortBy === 'time_asc') return a.BIT240202_PreparationTime - b.BIT240202_PreparationTime;
    return 0;
  });

  const renderDishItem = ({ item }: { item: any }) => {
    const itemId = String(item.id || item.BIT240202_Id);
    const thumbImg = item.BIT240202_DishImage?.find((img: any) => img.IsThumbnail)?.ImageUrl || 
                     item.BIT240202_DishImage?.[0]?.ImageUrl || 
                     'https://via.placeholder.com/150';
    
    const isQuick = Number(item.BIT240202_PreparationTime) <= 15;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push({ pathname: '/dish-detail', params: { dishId: itemId } })}
      >
        <Image source={{ uri: thumbImg }} style={styles.thumbImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.dishName}>{item.BIT240202_Name}</Text>
          <Text style={styles.dishPrice}>{Number(item.BIT240202_Price)?.toLocaleString()} VNĐ</Text>
          <View style={styles.badgeContainer}>
            <Text style={[styles.badge, isQuick ? styles.quickBadge : styles.regularBadge]}>
              {isQuick ? (lang === 'en' ? 'Quick' : 'Nhanh') : (lang === 'en' ? 'Regular' : 'Thông thường')} ({item.BIT240202_PreparationTime}m)
            </Text>
            {!item.BIT240202_IsAvailable && (
              <Text style={styles.offBadge}>{lang === 'en' ? 'Unavailable' : 'Ngừng bán'}</Text>
            )}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => router.push({ pathname: '/dish-form', params: { dishId: itemId } })}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{lang === 'en' ? 'Edit' : 'Sửa'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleDeleteDish(itemId)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{lang === 'en' ? 'Delete' : 'Xóa'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BIT240202_FoodManager</Text>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{lang === 'en' ? 'ENG 🇬🇧' : 'VIE 🇻🇳'}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={lang === 'en' ? 'Search dish name...' : 'Tìm kiếm tên món...'}
        placeholderTextColor="#aaa"
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* DẢI BẤM LỌC LOẠI MÓN - ĐÃ SỬA CSS HIỂN THỊ CHUẨN */}
      <View style={styles.catWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScrollContent}>
          <TouchableOpacity 
            style={[styles.catChip, selectedCategory === '' && styles.selectedCatChip]} 
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.catText, selectedCategory === '' && styles.selectedCatText]}>
              {lang === 'en' ? 'All' : 'Tất cả'}
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.BIT240202_Id}
              style={[styles.catChip, selectedCategory === cat.BIT240202_Id && styles.selectedCatChip]}
              onPress={() => setSelectedCategory(cat.BIT240202_Id)}
            >
              <Text style={[styles.catText, selectedCategory === cat.BIT240202_Id && styles.selectedCatText]}>
                {cat.BIT240202_Name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        <Text>{lang === 'en' ? 'Available Only' : 'Đang bán'}:</Text>
        <Switch value={availableOnly} onValueChange={setAvailableOnly} />
      </View>

      <View style={styles.priceRow}>
        <TextInput 
          style={styles.priceInput} 
          placeholder={lang === 'en' ? 'Min Price' : 'Giá tối thiểu'} 
          placeholderTextColor="#aaa"
          keyboardType="numeric" 
          value={minPrice} 
          onChangeText={setMinPrice} 
        />
        <Text style={{ marginHorizontal: 5, color: '#666' }}>-</Text>
        <TextInput 
          style={styles.priceInput} 
          placeholder={lang === 'en' ? 'Max Price' : 'Giá tối đa'} 
          placeholderTextColor="#aaa"
          keyboardType="numeric" 
          value={maxPrice} 
          onChangeText={setMaxPrice} 
        />
      </View>

      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy('price_asc')}>
          <Text style={styles.sortBtnText}>{lang === 'en' ? 'Price ↑' : 'Giá ↑'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy('price_desc')}>
          <Text style={styles.sortBtnText}>{lang === 'en' ? 'Price ↓' : 'Giá ↓'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy('time_asc')}>
          <Text style={styles.sortBtnText}>{lang === 'en' ? 'Prep Time ↑' : 'Thực hiện ↑'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDishes}
        keyExtractor={item => String(item.id || item.BIT240202_Id)}
        renderItem={renderDishItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>{lang === 'en' ? 'No dishes found' : 'Không tìm thấy món ăn'}</Text>}
      />

      <TouchableOpacity 
        style={styles.addBtn}
        onPress={() => router.push('/dish-form')}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{lang === 'en' ? '+ Add Dish' : '+ Thêm món'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Index() {
  return (
    <LanguageProvider>
      <DishListContent />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f8f9fa', paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  langBtn: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  
  // Style sửa cho Category filter
  catWrapper: { marginBottom: 10, height: 38 },
  catScrollContent: { alignItems: 'center' },
  catChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 20, 
    marginRight: 8, 
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedCatChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  catText: { fontSize: 13, color: '#333', fontWeight: '600' },
  selectedCatText: { color: '#fff' },

  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  priceInput: { flex: 1, backgroundColor: '#fff', padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 6 },
  sortRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  sortBtn: { backgroundColor: '#e9ecef', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  sortBtnText: { fontSize: 12, fontWeight: '600' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, elevation: 2 },
  thumbImage: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },
  cardInfo: { flex: 1 },
  dishName: { fontSize: 15, fontWeight: 'bold' },
  dishPrice: { color: '#28a745', fontWeight: 'bold', marginVertical: 2 },
  badgeContainer: { flexDirection: 'row', marginTop: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, color: '#fff', marginRight: 5 },
  quickBadge: { backgroundColor: '#28a745' },
  regularBadge: { backgroundColor: '#ffc107' },
  offBadge: { backgroundColor: '#dc3545', color: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10 },
  cardActions: { justifyContent: 'space-around' },
  editBtn: { backgroundColor: '#ffc107', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginBottom: 4 },
  deleteBtn: { backgroundColor: '#dc3545', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  addBtn: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 }
});