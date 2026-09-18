'use strict';

(function () {

  console.log(
    '[Barcodes] Module loaded'
  );

  const TEMPLATES = {
    standard: {
      name: 'x2 Label Template'
    },

    small: {
      name: 'x4 Label Template'
    },

    medium: {
      name: 'x8 Label Template'
    },

    large: {
      name: 'x10 Label Template'
    },

    xlarge: {
      name: 'x30 Label Template'
    }
  };

  function init() {

    console.log(
      '[Barcodes] Starting'
    );

    const CARD =
      document.querySelector(
        '#barcode-drop'
      );

    if (!CARD) {

      console.log(
        '[Barcodes] #barcode-drop not found'
      );

      return;
    }

    console.log(
      '[Barcodes] #barcode-drop found'
    );

    if (
      document.querySelector(
        '.barcode-dropdown-menu'
      )
    ) {

      console.log(
        '[Barcodes] Already initialized'
      );

      return;
    }

    const MENU =
      document.createElement('div');

    MENU.className =
      'barcode-dropdown-menu';

    Object.entries(TEMPLATES)
      .forEach(([id, template]) => {

        const item =
          document.createElement('div');

        item.className =
          'barcode-dropdown-item';

        item.dataset.barcodeTemplate =
          id;

        item.textContent =
          template.name;

        MENU.appendChild(item);

      });

    const divider =
      document.createElement('div');

    divider.className =
      'barcode-dropdown-divider';

    MENU.appendChild(divider);

    const history =
      document.createElement('div');

    history.className =
      'barcode-dropdown-item';

    history.dataset.barcodeHistory =
      '';

    history.textContent =
      'Print History';

    MENU.appendChild(history);

    CARD.parentElement.appendChild(
      MENU
    );

    console.log(
      '[Barcodes] Dropdown created'
    );

    CARD.addEventListener(
      'click',
      e => {

        e.preventDefault();
        e.stopPropagation();

        MENU.classList.toggle(
          'open'
        );

        console.log(
          '[Barcodes] Dropdown toggled'
        );

      }
    );

    MENU
      .querySelectorAll(
        '[data-barcode-template]'
      )
      .forEach(item => {

        item.addEventListener(
          'click',
          e => {

            e.preventDefault();
            e.stopPropagation();

            const template =
              item.dataset
                .barcodeTemplate;

            console.log(
              '[Barcodes] Template selected:',
              template
            );

            MENU.classList.remove(
              'open'
            );

            document.dispatchEvent(
              new CustomEvent(
                'barcode-template-select',
                {
                  detail: {
                    template
                  }
                }
              )
            );

          }
        );

      });

    history.addEventListener(
      'click',
      e => {

        e.preventDefault();
        e.stopPropagation();

        console.log(
          '[Barcodes] History selected'
        );

        MENU.classList.remove(
          'open'
        );

        document.dispatchEvent(
          new CustomEvent(
            'barcode-history-open'
          )
        );

      }
    );

    document.addEventListener(
      'click',
      e => {

        if (
          !CARD.contains(e.target) &&
          !MENU.contains(e.target)
        ) {
          MENU.classList.remove(
            'open'
          );
        }

      }
    );

  }

  document.addEventListener(
    'db-tool-open',
    e => {

      console.log(
        '[Barcodes] db-tool-open:',
        e.detail
      );

      if (
        e.detail?.id !== 'barcodes'
      ) {
        return;
      }

      init();

    }
  );

  init();

})();
