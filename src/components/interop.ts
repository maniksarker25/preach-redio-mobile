import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

/** Let third-party views accept `className` like core components. Imported once at startup. */
cssInterop(Image, { className: 'style' });
cssInterop(LinearGradient, { className: 'style' });
cssInterop(BlurView, { className: 'style' });
