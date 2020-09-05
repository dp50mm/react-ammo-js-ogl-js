import React, { useState, useEffect, useRef } from 'react'
import useComponentSize from '@rehooks/component-size'
import { start, stop, animating, windowResize } from './renderer'

const BoxesSyncDemo = React.memo(() => {
    let containerRef = useRef(null)
    const [initialized, setInitialized] = useState(false)
    const [playingStateChangeCounter, setPlayingStateChangeCounter] = useState(0)
    let containerSize = useComponentSize(containerRef)
    let size = {
        width: containerSize.width,
        height: window.innerHeight
    }

    useEffect(() => {
        if(initialized === false && containerRef.current !== null && size.width > 0) {
            setInitialized(true)
            start(containerRef.current, size)
        }
    })
    useEffect(() => {
        let listener = window.addEventListener('resize', () => {
            console.log('window resize')
            size = {
                width: containerSize.width,
                height: window.innerHeight
            }
            console.log(size)
            windowResize(size)
        }, false)
        return () => window.removeEventListener('resize', listener)
    })

    return (
        <div className='cloth-demo'>
            <div ref={containerRef}></div>
        </div>
    )
})

export default BoxesSyncDemo