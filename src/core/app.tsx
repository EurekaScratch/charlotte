import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
// global CSS
import globalCss from './style.css';
// CSS modules
import styles, { stylesheet } from './style.module.css';

function Counter () {
    const [getCount, setCount] = createSignal(0);
    const handleAmazing = () => {
        setCount((count) => count + 1);
    };
    return (
        <div>
            <button class={styles.plus1} onClick={handleAmazing}>
        Amazing+1
            </button>
            <p>Drag me</p>
            <p>
                <span class={styles.count}>{getCount()}</span> people think this is
        amazing.
            </p>
        </div>
    );
}
