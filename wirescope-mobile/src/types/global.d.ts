// Global type definitions for React Native development

declare var __DEV__: boolean;

declare module 'react-native-vector-icons/MaterialIcons' {
  import { Icon } from 'react-native-vector-icons/Icon';
  const MaterialIcons: typeof Icon;
  export default MaterialIcons;
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Icon } from 'react-native-vector-icons/Icon';
  const Ionicons: typeof Icon;
  export default Ionicons;
}

declare module 'react-native-qrcode-scanner' {
  export interface QRCodeScannerProps {
    onRead: (e: { data: string; type: string }) => void;
    reactivate?: boolean;
    reactivateTimeout?: number;
    showMarker?: boolean;
    fadeIn?: boolean;
    cameraStyle?: any;
    topContent?: React.ReactNode;
    bottomContent?: React.ReactNode;
    containerStyle?: any;
    cameraProps?: any;
    checkAndroid6Permissions?: boolean;
    permissionDialogTitle?: string;
    permissionDialogMessage?: string;
    buttonPositive?: string;
    flashMode?: any;
    vibrate?: boolean;
  }
  
  export default class QRCodeScanner extends React.Component<QRCodeScannerProps> {}
}

// Extend global console for React Native
interface Console {
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
}

declare var console: Console;