"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { courses } from '@/lib/courses';

export default function EducationPage(){
  const router = useRouter();

  return (
    <div className="educ-root">
      <h1>Education</h1>
      <p>Pelajari trading lewat course singkat dan video terstruktur.</p>
      <div style={{marginTop:8, marginBottom:12}}>
        <button className="educ-btn primary" onClick={() => router.push('/education/chart')}>Open chart</button>
      </div>

      <div className="educ-list">
        {courses.map(c => (
          <div
            key={c.id}
            className="educ-card"
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/education/${c.slug}`)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') router.push(`/education/${c.slug}`); }}
            style={{ cursor: 'pointer' }}
          >
            <div className="educ-thumb"><Image src={c.thumbnail || '/file.svg'} alt={c.title} width={40} height={40} /></div>
            <div className="educ-meta">
              <div className="educ-title">{c.title}</div>
              <div className="educ-desc">{c.description}</div>
              <div className="educ-actions">
                <button className="educ-btn" onClick={(e: React.MouseEvent) => { e.stopPropagation(); /* preview action */ }}>Preview</button>
                <button className="educ-btn primary" onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/education/${c.slug}`); }}>Open</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
