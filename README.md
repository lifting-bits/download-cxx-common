# download-cxx-common
Download cxx-common github action

## Supported parameters

See [action.yml](https://github.com/lifting-bits/download-cxx-common/blob/main/action.yml)

## Example action step:

```
    - name: Download cxx-common
      id: cxxcommon
      uses: lifting-bits/download-cxx-common@v1
      with:
        llvm: 13
        version: v0.2.2
        token: ${{ secrets.GITHUB_TOKEN }}
        image: ubuntu
        image_tag: 20.04
        destination: ./install
```

Usage in the following cmake steps:

```
  cmake -DVCPKG_ROOT=${{ steps.cxxcommon.outputs.path }} ...
```
