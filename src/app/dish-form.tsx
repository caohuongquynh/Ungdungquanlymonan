import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getCategories, getDishes, saveDishes } from '../database/storage';
import { MOCK_API_URL } from '../services/syncService';

export default function DishFormScreen() {
  const { dishId } = useLocalSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [allDishes, setAllDishes] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  
  const [images, setImages] = useState<any[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    const init = async () => {
      const cats = await getCategories();
      const dishes = await getDishes();
      setCategories(cats);
      setAllDishes(dishes);

      if (dishId) {
        const item = dishes.find((d: any) => String(d.id || d.BIT240202_Id) === String(dishId));
        if (item) {
          setName(item.BIT240202_Name || '');
          setPrice(String(item.BIT240202_Price || ''));
          setPrepTime(String(item.BIT240202_PreparationTime || ''));
          setDescription(item.BIT240202_Description || '');
          setCategoryId(item.BIT240202_DishCategoryId || (cats[0]?.BIT240202_Id || ''));
          setIsAvailable(item.BIT240202_IsAvailable ?? true);
          setImages(item.BIT240202_DishImage || []);
        }
      } else if (cats.length > 0) {
        setCategoryId(cats[0].BIT240202_Id);
      }
    };
    init();
  }, [dishId]);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const isFirst = images.length === 0;
    setImages([...images, { ImageUrl: newImageUrl.trim(), IsThumbnail: isFirst }]);
    setNewImageUrl('');
  };

  const handleSetThumbnail = (targetUrl: string) => {
    const updated = images.map(img => ({
      ...img,
      IsThumbnail: img.ImageUrl === targetUrl
    }));
    setImages(updated);
  };

  // Hàm LƯU MÓN ĂN CHUẨN ĐÚNG
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên món không được để rỗng!');
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Lỗi', 'Giá phải lớn hơn 0!');
      return;
    }
    if (isNaN(Number(prepTime)) || Number(prepTime) <= 0) {
      Alert.alert('Lỗi', 'Thời gian chế biến phải lớn hơn 0!');
      return;
    }
    if (!categoryId) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại món ăn!');
      return;
    }

    const isDuplicate = allDishes.some(
      d => d.BIT240202_Name?.toLowerCase().trim() === name.toLowerCase().trim() &&
           d.BIT240202_DishCategoryId === categoryId &&
           String(d.id || d.BIT240202_Id) !== String(dishId)
    );
    if (isDuplicate) {
      Alert.alert('Lỗi', 'Tên món đã tồn tại trong cùng loại!');
      return;
    }

    const newId = dishId ? String(dishId) : String(Date.now());
    const dishData = {
      id: newId,
      BIT240202_Id: newId,
      BIT240202_Name: name.trim(),
      BIT240202_Price: Number(price),
      BIT240202_PreparationTime: Number(prepTime),
      BIT240202_Description: description,
      BIT240202_DishCategoryId: categoryId,
      BIT240202_IsAvailable: isAvailable,
      BIT240202_DishImage: images,
      BIT240202_IsSynced: false,
      isNew: !dishId
    };

    let updatedList = [];
    if (dishId) {
      updatedList = allDishes.map(d => String(d.id || d.BIT240202_Id) === String(dishId) ? dishData : d);
    } else {
      updatedList = [dishData, ...allDishes];
    }

    // 1. Lưu ngay lập tức vào Local AsyncStorage
    await saveDishes(updatedList);

    // 2. Nếu có mạng thì gửi lên MockAPI
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      try {
        if (dishId) {
          await axios.put(`${MOCK_API_URL}/${dishId}`, dishData);
        } else {
          const { isNew, ...postData } = dishData;
          await axios.post(MOCK_API_URL, postData);
        }
        dishData.BIT240202_IsSynced = true;
        await saveDishes(updatedList);
      } catch (err) {
        console.log("MockAPI chưa kết nối, đã lưu vào máy local.");
      }
    }

    // Quay về màn hình danh sách
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Dish Name / Tên món *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter name..." placeholderTextColor="#aaa" />

      <Text style={styles.label}>Price / Giá (VNĐ) *</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} placeholder="Enter price..." placeholderTextColor="#aaa" />

      <Text style={styles.label}>Preparation Time / Thời gian (Phút) *</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={prepTime} onChangeText={setPrepTime} placeholder="Enter time..." placeholderTextColor="#aaa" />

      <Text style={styles.label}>Category / Loại món *</Text>
      <View style={styles.catContainer}>
        {categories.map(cat => (
          <TouchableOpacity 
            key={cat.BIT240202_Id}
            style={[styles.catChip, categoryId === cat.BIT240202_Id && styles.selectedCatChip]}
            onPress={() => setCategoryId(cat.BIT240202_Id)}
          >
            <Text style={{ color: categoryId === cat.BIT240202_Id ? '#fff' : '#333' }}>
              {cat.BIT240202_Name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description / Mô tả</Text>
      <TextInput style={[styles.input, { height: 60 }]} multiline value={description} onChangeText={setDescription} placeholder="Enter description..." placeholderTextColor="#aaa" />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Available / Đang bán</Text>
        <Switch value={isAvailable} onValueChange={setIsAvailable} />
      </View>

      <Text style={styles.label}>Add Image URL / Thêm URL Ảnh</Text>
      <View style={styles.imgInputRow}>
        <TextInput 
          style={[styles.input, { flex: 1, marginBottom: 0 }]} 
          placeholder="Paste Image URL" 
          placeholderTextColor="#aaa"
          value={newImageUrl} 
          onChangeText={setNewImageUrl} 
        />
        <TouchableOpacity style={styles.addImgBtn} onPress={handleAddImage}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add / Thêm</Text>
        </TouchableOpacity>
      </View>

      {images.map((img, idx) => (
        <View key={idx} style={styles.imgRow}>
          <Image source={{ uri: img.ImageUrl }} style={{ width: 45, height: 45, borderRadius: 5 }} />
          <Text style={{ flex: 1, marginLeft: 10 }}>{img.IsThumbnail ? '⭐ Thumbnail' : ''}</Text>
          {!img.IsThumbnail && (
            <TouchableOpacity style={styles.thumbBtn} onPress={() => handleSetThumbnail(img.ImageUrl)}>
              <Text style={{ fontSize: 11 }}>Set Thumbnail</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Dish / Lưu món ăn</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff', paddingTop: 20 },
  label: { fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 10 },
  catContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  catChip: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 16, marginRight: 8, marginBottom: 8 },
  selectedCatChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  imgInputRow: { flexDirection: 'row', marginBottom: 10 },
  addImgBtn: { backgroundColor: '#007AFF', paddingHorizontal: 15, borderRadius: 6, marginLeft: 8, justifyContent: 'center' },
  imgRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#eee', padding: 6, borderRadius: 6 },
  thumbBtn: { backgroundColor: '#e9ecef', padding: 6, borderRadius: 4 },
  saveBtn: { backgroundColor: '#28a745', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});