import { useState } from 'react';
import { createPortal } from 'react-dom';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './ShareButton.module.css';

interface Props {
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

/**
 * Import-JSON modal with a real Textarea — robustly handles long JSON pastes
 * that window.prompt() would mangle. Works in both H5 (via React DOM portal)
 * and weapp (renders in-place; position:fixed covers the screen).
 */
export function ImportJsonModal({ onConfirm, onCancel }: Props) {
  const [text, setText] = useState('');

  async function pasteFromClipboard() {
    try {
      let value = '';
      if (process.env.TARO_ENV === 'h5' &&
          typeof navigator !== 'undefined' &&
          (navigator as any).clipboard?.readText) {
        value = await (navigator as any).clipboard.readText();
      } else {
        const r = await Taro.getClipboardData();
        value = r.data || '';
      }
      if (value) {
        setText(value);
        Taro.showToast({ title: `已读取 ${value.length} 字符`, icon: 'none', duration: 1200 });
      } else {
        Taro.showToast({ title: '剪贴板为空', icon: 'none', duration: 1500 });
      }
    } catch (e) {
      Taro.showToast({ title: '读取失败,请手动粘贴', icon: 'none', duration: 1800 });
    }
  }

  function confirm() {
    if (!text.trim()) {
      Taro.showToast({ title: '请先粘贴 JSON', icon: 'none', duration: 1500 });
      return;
    }
    onConfirm(text.trim());
  }

  const modal = (
    <View className={styles.modal} onClick={onCancel}>
      <View
        className={styles.modalInner}
        style={{ width: '90vw', maxWidth: '500px' }}
        onClick={(e: any) => e.stopPropagation && e.stopPropagation()}
      >
        <View className={styles.modalHeader}>
          <Text className={styles.modalTitle}>导入备份 JSON</Text>
          <View className={styles.modalClose} onClick={onCancel}>
            <Text>✕</Text>
          </View>
        </View>

        <Textarea
          value={text}
          placeholder='把备份 JSON 整段粘贴到这里…'
          autoHeight={false}
          maxlength={-1}
          style={{
            width: '100%',
            height: '180px',
            border: '1px solid rgba(148,163,184,0.4)',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            background: '#fafafa',
            boxSizing: 'border-box',
          }}
          onInput={(e: any) => setText(e.detail.value)}
        />

        <View
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '8px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              padding: '6px 12px',
              background: 'rgba(37, 99, 235, 0.1)',
              color: '#2563eb',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
            }}
            onClick={pasteFromClipboard}
          >
            <Text>📋 从剪贴板读</Text>
          </View>
          <Text style={{ fontSize: '11px', color: '#94a3b8' }}>
            {text ? `${text.length} 字符` : '未粘贴'}
          </Text>
        </View>

        <View style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <View
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(148,163,184,0.15)',
              color: '#64748b',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 600,
            }}
            onClick={onCancel}
          >
            <Text>取消</Text>
          </View>
          <View
            style={{
              flex: 1,
              padding: '10px',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(74,222,128,0.9))',
              color: '#fff',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(34,197,94,0.25)',
            }}
            onClick={confirm}
          >
            <Text>导入</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const useDomPortal =
    process.env.TARO_ENV === 'h5' &&
    typeof document !== 'undefined' &&
    !!document.body;
  if (useDomPortal) {
    return createPortal(modal, document.body);
  }
  return modal;
}
