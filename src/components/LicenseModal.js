import { Code, ExternalLink, Heart, Shield, X } from 'lucide-react-native';
import { Linking, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const LicenseModal = ({ isOpen, onClose }) => {
  const openLink = () => {
    Linking.openURL('https://www.linkedin.com/in/rodney-austria-/');
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        
        {/* Modal Content */}
        <View className="w-full max-w-md bg-slate-900 rounded-3xl border border-white/10 overflow-hidden max-h-[85%]">
          
          {/* Header */}
          <View className="flex-row justify-between items-start p-6 border-b border-white/5">
            <View>
              <Text className="text-3xl font-bold text-white">Striven</Text>
              <Text className="text-gray-400 text-sm">Privacy-First Fitness Tracker</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              className="p-2 bg-white/5 rounded-full"
            >
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            
            {/* Developer Info Card */}
            <TouchableOpacity 
              onPress={openLink}
              className="bg-slate-800 rounded-2xl p-4 mb-6 border border-emerald-500/30"
            >
              <View className="flex-row items-center space-x-4 mb-3">
                <View className="bg-emerald-500 p-3 rounded-xl">
                  <Code size={24} color="white" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-white font-bold text-lg">Rodney Austria</Text>
                    <ExternalLink size={14} color="#34d399" />
                  </View>
                  <Text className="text-emerald-400 text-xs font-bold">© 2025 All Rights Reserved</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs leading-5">
                Built with passion for privacy and fitness. This app stores all your data locally on your device.
              </Text>
            </TouchableOpacity>

            {/* License Section */}
            <View className="mb-6">
              <View className="flex-row items-center space-x-2 mb-3">
                <Shield size={18} color="#60a5fa" />
                <Text className="text-white font-bold text-lg">MIT License</Text>
              </View>
              
              <View className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Text className="text-gray-400 text-xs font-mono leading-5">
                  Copyright (c) 2025 Rodney Austria{'\n\n'}
                  Permission is hereby granted, free of charge, to any person obtaining a copy...
                  {/* Truncated for mobile UI cleanliness */}
                  {'\n\n'}THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
                </Text>
              </View>
            </View>

            {/* Features Grid */}
            <View className="flex-row space-x-3 mb-6">
              <View className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <Shield size={20} color="#4ade80" style={{marginBottom: 8}} />
                <Text className="text-white font-bold text-xs">Privacy First</Text>
                <Text className="text-gray-500 text-[10px]">Local Storage</Text>
              </View>
              <View className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <Heart size={20} color="#f87171" style={{marginBottom: 8}} />
                <Text className="text-white font-bold text-xs">Open Source</Text>
                <Text className="text-gray-500 text-[10px]">MIT Licensed</Text>
              </View>
            </View>

            {/* Version */}
            <View className="items-center pb-4">
              <Text className="text-gray-600 text-xs">Version 1.0.0</Text>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default LicenseModal;