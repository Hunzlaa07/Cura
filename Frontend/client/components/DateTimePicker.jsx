import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function DateTimePicker({ value, onChange, label, i18nLanguage = 'en', required = false }) {
  const [showPicker, setShowPicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

  const isArabic = i18nLanguage === 'ar';
  
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthNames = isArabic 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = isArabic 
    ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day) => {
    const selected = new Date(tempDate.getFullYear(), tempDate.getMonth(), day);
    selected.setHours(tempDate.getHours(), tempDate.getMinutes());
    setCurrentDate(selected);
  };

  const handleTimeChange = (field, val) => {
    const updated = new Date(currentDate);
    if (field === 'hours') {
      let hour = parseInt(val) || 0;
      // Convert 12-hour to 24-hour based on AM/PM
      if (period === 'AM' && hour === 12) hour = 0;
      if (period === 'PM' && hour !== 12) hour += 12;
      updated.setHours(hour);
    } else {
      updated.setMinutes(parseInt(val) || 0);
    }
    setCurrentDate(updated);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const updated = new Date(currentDate);
    let hour = updated.getHours();
    
    if (newPeriod === 'PM' && hour < 12) {
      hour += 12;
    } else if (newPeriod === 'AM' && hour >= 12) {
      hour -= 12;
    }
    updated.setHours(hour);
    setCurrentDate(updated);
  };

  const getDisplay12Hour = () => {
    let hour = currentDate.getHours();
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return String(hour).padStart(2, '0');
  };

  const handleConfirm = () => {
    // Format as local datetime-local format: YYYY-MM-DDTHH:mm
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const localDatetime = `${year}-${month}-${day}T${hours}:${minutes}`;
    onChange(localDatetime);
    setShowPicker(false);
  };

  const formatDisplayDate = () => {
    if (!value) return isArabic ? 'اختر التاريخ' : 'Select date';
    const date = new Date(value);
    return date.toLocaleString(isArabic ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysArray = () => {
    const days = [];
    const totalDays = daysInMonth(tempDate);
    const firstDay = firstDayOfMonth(tempDate);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  };
const [period, setPeriod] = useState(value ? (new Date(value).getHours() >= 12 ? 'PM' : 'AM') : 'AM');            {/* Day names */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '8px',
                width: '100%'
              }}
            >
              {dayNames.map(day => (
                <div key={day} style={{ textAlign: 'center' }} className="h-8 flex items-center justify-center text-xs font-bold text-gray-600">
                  {day}
                </div>
              ))}
            </div>
  const daysArray = getDaysArray();
  const weeks = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    weeks.push(daysArray.slice(i, i + 7));
  }

  return (
    <div className="relative w-full">
      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-sm font-medium text-left text-gray-700 hover:border-[#C8F55A] transition-colors flex items-center justify-between"
      >
        <span>{formatDisplayDate()}</span>
        <Clock className="w-4 h-4 text-[#C8F55A]" />
      </button>

      {showPicker && (
        <div className="fixed z-50 bg-white border-2 border-[#C8F55A] rounded-2xl shadow-2xl p-4 md:p-5" style={{ 
          width: '420px', 
          maxWidth: '90vw',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
            {/* Month/Year Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className={`w-5 h-5 text-[#C8F55A] ${isArabic ? 'scale-x-[-1]' : ''}`} />
              </button>
              <h3 className="text-sm font-semibold text-[#1a1a1a] min-w-[150px] text-center">
                {monthNames[tempDate.getMonth()]} {tempDate.getFullYear()}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className={`w-5 h-5 text-[#C8F55A] ${isArabic ? 'scale-x-[-1]' : ''}`} />
              </button>
            </div>

            {/* Day names */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '8px',
                width: '100%'
              }}
            >
              {dayNames.map(day => (
                <div key={day} style={{ textAlign: 'center' }} className="h-8 flex items-center justify-center text-xs font-bold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - THE FIX */}
            <div className="mb-4">
              {weeks.map((week, weekIdx) => (
                <div 
                  key={weekIdx} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '4px',
                    marginBottom: '4px',
                    width: '100%'
                  }}
                >
                  {week.map((day, dayIdx) => {
                    const isSelected = day && 
                      currentDate.getDate() === day && 
                      currentDate.getMonth() === tempDate.getMonth() &&
                      currentDate.getFullYear() === tempDate.getFullYear();
                    const isToday = day &&
                      new Date().getDate() === day && 
                      new Date().getMonth() === tempDate.getMonth() &&
                      new Date().getFullYear() === tempDate.getFullYear();

                    return (
                      <div key={dayIdx} style={{ width: '100%' }}>
                        {day ? (
                          <button
                            onClick={() => handleDateSelect(day)}
                            style={{ width: '100%' }}
                            className={`h-9 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-[#C8F55A] text-[#1a1a1a] font-bold shadow-md'
                                : isToday
                                ? 'bg-blue-100 text-blue-600 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {day}
                          </button>
                        ) : (
                          <div style={{ height: '36px' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Time selector */}
            <div className="border-t pt-4 mb-4">
              <p className="text-xs font-medium text-gray-700 mb-3">{isArabic ? 'الوقت' : 'Time'}</p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[11px] text-gray-600 block mb-1.5">{isArabic ? 'الساعة' : 'Hours'}</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={getDisplay12Hour()}
                    onChange={(e) => handleTimeChange('hours', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center font-medium focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                  />
                </div>
                <div className="text-gray-400 font-bold text-lg mb-2">:</div>
                <div className="flex-1">
                  <label className="text-[11px] text-gray-600 block mb-1.5">{isArabic ? 'الدقائق' : 'Minutes'}</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={String(currentDate.getMinutes()).padStart(2, '0')}
                    onChange={(e) => handleTimeChange('minutes', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center font-medium focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePeriodChange('AM')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      period === 'AM'
                        ? 'bg-[#C8F55A] text-[#1a1a1a]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => handlePeriodChange('PM')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      period === 'PM'
                        ? 'bg-[#C8F55A] text-[#1a1a1a]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPicker(false);
                  setTempDate(value ? new Date(value) : new Date());
                }}
                className="flex-1 px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-3 py-2.5 bg-[#C8F55A] hover:bg-[#b8e54a] rounded-lg text-sm font-bold text-[#1a1a1a] transition-colors"
              >
                {isArabic ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
        </div>
      )}
    </div>
  );
}