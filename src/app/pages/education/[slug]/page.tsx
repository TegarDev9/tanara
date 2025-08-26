"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { courses, Course } from '@/lib/courses';
import '../education.css';

export default function CourseDetail(){
  const params = useParams() as Record<string, string> | undefined;
  const slug = params?.slug as string | undefined;
  const course = courses.find(c => c.slug === slug) as Course | undefined;
  const [playing, setPlaying] = useState<string | null>(null);

  if (!course) return <div style={{padding:20}}>Course not found.</div>;

  return (
    <div className="educ-root educ-detail">
      <h1>{course.title}</h1>
      <p className="educ-desc">{course.description}</p>

      <div className="educ-videos">
        {course.videos.map(v => (
          <div key={v.id} className="educ-video">
            <div className="educ-video-title">{v.title} <span style={{color:'#6b7280',fontSize:12}}> {v.duration}</span></div>
            <div className="educ-video-desc">{v.description}</div>
            <div style={{marginTop:8}}>
              <button className="educ-btn primary" onClick={() => setPlaying(v.id)}>Play</button>
              <button className="educ-btn" style={{marginLeft:8}} onClick={() => setPlaying(null)}>Stop</button>
            </div>
            {playing === v.id && (
              <div style={{marginTop:8}}>
                <video src={v.url} controls style={{width:'100%', borderRadius:8}} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
