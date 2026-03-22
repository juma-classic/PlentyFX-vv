import ModernLoadingSpinner from './ModernLoadingSpinner';

export default function ChunkLoader({ message }: { message: string }) {
    return (
        <div className='modern-chunk-loader'>
            <ModernLoadingSpinner size='large' variant='primary' text={message} />

            <style jsx>{`
                .modern-chunk-loader {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    color: white;
                }
            `}</style>
        </div>
    );
}
