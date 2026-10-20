import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDishes } from '../database/storage';

export default function DishDetailScreen() {
  const { dishId } = useLocalSearchParams();
  const router = useRouter();
  const [dish, setDish] = useState<any>(null);
  const [selectedImg, setSelectedImg] = useState('');

  useEffect(() => {
    const fetchDish = async () => {
      const list = await getDishes();
      const item = list.find((d: any) => String(d.id || d.BIT240202_Id) === String(dishId));
      if (item) {
        setDish(item);
        const thumb = item.BIT240202_DishImage?.find((i: any) => i.IsThumbnail)?.ImageUrl || item.BIT240202_DishImage?.[0]?.ImageUrl;
        setSelectedImg(thumb);
      }
    };
    fetchDish();
  }, [dishId]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (!dish) return <View style={styles.container}><Text style={{ textAlign: 'center', marginTop: 20 }}>Đang tải...</Text></View>;

  const isQuick = Number(dish.BIT240202_PreparationTime) <= 15;

  return (
    <ScrollView style={styles.container}>
      {/* Nút Quay lại chỉ hiển thị biểu tượng Mũi tên ← */}
      <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* Ảnh chính */}
      <Image source={{ uri: selectedImg || 'https://via.placeholder.com/300' }} style={styles.mainImage} />
      
      {/* Bộ sưu tập ảnh */}
      <ScrollView horizontal style={styles.gallery}>
        {dish.BIT240202_DishImage?.map((img: any, idx: number) => (
          <TouchableOpacity key={idx} onPress={() => setSelectedImg(img.ImageUrl)}>
            <Image 
              source={{ uri: img.ImageUrl }} 
              style={[styles.galleryImg, img.ImageUrl === selectedImg && styles.activeGalleryImg]} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Thông tin chi tiết */}
      <View style={styles.details}>
        <Text style={styles.title}>{dish.BIT240202_Name}</Text>
        <Text style={styles.price}>{Number(dish.BIT240202_Price)?.toLocaleString()} VNĐ</Text>
        <Text style={styles.tag}>Loại món: {dish.BIT240202_DishCategoryId}</Text>
        <Text style={styles.tag}>
          Thời gian chế biến: {dish.BIT240202_PreparationTime} phút ({isQuick ? 'Quick / Nhanh' : 'Regular / Thông thường'})
        </Text>
        <Text style={styles.desc}>{dish.BIT240202_Description}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 20 },
  backBtn: { 
    backgroundColor: '#e9ecef', 
    width: 40,
    height: 40,
    borderRadius: 20, 
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10, 
    alignSelf: 'flex-start'
  },
  backText: { color: '#007AFF', fontSize: 20, fontWeight: 'bold' },
  mainImage: { width: '100%', height: 220, resizeMode: 'cover' },
  gallery: { flexDirection: 'row', padding: 10 },
  galleryImg: { width: 60, height: 60, borderRadius: 6, marginRight: 10 },
  activeGalleryImg: { borderWidth: 2, borderColor: '#007AFF' },
  details: { padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  price: { fontSize: 18, color: '#28a745', marginVertical: 6, fontWeight: 'bold' },
  tag: { fontSize: 14, color: '#555', marginBottom: 4 },
  desc: { fontSize: 14, marginTop: 10, lineHeight: 20, color: '#333' }
});