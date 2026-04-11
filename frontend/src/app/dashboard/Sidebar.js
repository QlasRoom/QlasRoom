'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, X, Trash2 } from 'lucide-react';

export default function Sidebar({ 
    activeTab, 
    currentMonth, 
    setCurrentMonth, 
    checkIns, 
    selectedDate, 
    setSelectedDate, 
    todos, 
    handleAddTodo, 
    newTodo, 
    setNewTodo, 
    toggleTodo, 
    deleteTodo 
}) {
    if (activeTab === 'manage') return null;

    return (
        <aside style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Daily Check-in Calendar */}
            <div className="auth-card glass-menu" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <CalendarIcon size={18} style={{ color: 'var(--primary-color)' }} /> Streak
                    </h3>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.1rem' }}
                        ><ChevronLeft size={16} /></button>
                        <button 
                            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.1rem' }}
                        ><ChevronRight size={16} /></button>
                    </div>
                </div>
                
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {currentMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.15rem', textAlign: 'center', maxWidth: '180px', margin: '0 auto' }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={`${d}-${i}`} style={{ fontSize: '0.6rem', color: 'var(--text-dim)', paddingBottom: '0.2rem' }}>{d}</div>
                    ))}
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const isChecked = checkIns.includes(dateStr);
                        const isSelected = selectedDate === dateStr;
                        
                        return (
                            <div 
                                key={day}
                                onClick={() => setSelectedDate(dateStr)}
                                style={{ 
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.6rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: isChecked ? 'var(--primary-gradient)' : (isSelected ? 'rgba(174, 129, 255, 0.2)' : 'rgba(255,255,255,0.02)'),
                                    color: isChecked ? '#000' : (isSelected ? 'var(--primary-color)' : '#fff'),
                                    border: isSelected ? '1px solid var(--primary-color)' : (isToday ? '1px solid rgba(174, 129, 255, 0.3)' : '1px solid transparent'),
                                    fontWeight: (isSelected || isChecked) ? 700 : 400,
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                {day}
                                {isToday && !isChecked && <div style={{ position: 'absolute', bottom: '2px', width: '3px', height: '3px', background: 'var(--primary-color)', borderRadius: '50%' }}></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Learning To-Do List */}
            <div className="auth-card glass-menu" style={{ padding: '1.5rem', flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <CheckCircle2 size={20} style={{ color: 'var(--primary-color)' }} /> Goals for {(() => {
                        const d = new Date(selectedDate);
                        const today = new Date().toISOString().split('T')[0];
                        if (selectedDate === today) return 'Today';
                        return d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    })()}
                </h3>
                
                <form onSubmit={handleAddTodo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <input 
                        type="text" 
                        className="form-group" 
                        style={{ margin: 0, padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#fff', flex: 1, fontSize: '0.85rem' }}
                        placeholder="Add a goal..."
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                    />
                    <button type="submit" className="btn-primary" style={{ margin: 0, width: 'auto', padding: '0 0.8rem', fontSize: '1.2rem' }}>+</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                    {todos.filter(t => t.date === selectedDate).length === 0 ? (
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No goals for this day.</p>
                    ) : (
                        todos.filter(t => t.date === selectedDate).map(todo => (
                            <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div 
                                    onClick={() => toggleTodo(todo.id)}
                                    style={{ 
                                        width: '18px', 
                                        height: '18px', 
                                        borderRadius: '5px', 
                                        border: `2px solid ${todo.completed ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)'}`,
                                        background: todo.completed ? 'var(--primary-color)' : 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}
                                >
                                    {todo.completed && <X size={12} color="#000" />}
                                </div>
                                <span style={{ 
                                    fontSize: '0.9rem', 
                                    color: todo.completed ? 'var(--text-dim)' : '#fff',
                                    textDecoration: todo.completed ? 'line-through' : 'none',
                                    flex: 1,
                                    cursor: 'pointer'
                                }} onClick={() => toggleTodo(todo.id)}>
                                    {todo.text}
                                </span>
                                <button 
                                    onClick={() => deleteTodo(todo.id)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', padding: '0.2rem', opacity: 0.6, cursor: 'pointer' }}
                                ><Trash2 size={14} /></button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
