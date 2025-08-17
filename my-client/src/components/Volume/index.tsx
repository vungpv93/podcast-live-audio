import React, { useCallback } from 'react';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';

interface VolumeSliderProps {
  value: number; // 0 - 100
  onChange: (newValue: number) => void;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({ value, onChange }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.round(Number(e.target.value));
      onChange(v);
    },
    [onChange],
  );

  // gradient fill: from left to value% use blue, rest gray
  const fillStyle = {
    background: `linear-gradient(90deg, #2563eb ${value}%, #374151 ${value}%)`, // blue-600 / gray-700
  };

  return (
    <div className={`flex items-center space-x-3`}>
      <div className="w-6 h-6 text-gray-200">
        {value ? (
          <HiSpeakerWave className="w-6 h-6 text-gray-200" />
        ) : (
          <HiSpeakerXMark className="w-6 h-6 text-gray-200" />
        )}
      </div>

      <div className="flex-1">
        <input
          aria-label="Volume"
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={handleChange}
          style={fillStyle}
          className="w-full h-2 rounded-full appearance-none range-track"
        />
      </div>

      <div className="w-12 text-right text-sm text-gray-300 select-none">
        {value}%
      </div>
    </div>
  );
};

export default VolumeSlider;
